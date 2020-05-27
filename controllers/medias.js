'use strict';

// Required libraries
const ibm = require('ibm-cos-sdk');
const fs = require('fs');
const async = require('async');
const uuidv1 = require('uuid/v1');
const crypto = require('crypto');

function logError(e) {
    console.log(`ERROR: ${e.code} - ${e.message}\n`);
}

function logDone() {
    console.log('DONE!\n');
}

function getUUID() {
    return uuidv1().toString().replace(/-/g, "");
}

function generateBigRandomFile(fileName, size) {
    return new Promise(function(resolve, reject) {
        crypto.randomBytes(size, (err, buf) => {
            if (err) reject(err);

            fs.writeFile(fileName, buf, function (err) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });     
        });      
    });
}

// Retrieve the list of available buckets
function getBuckets() {
    console.log('Retrieving list of buckets');
    return cos.listBuckets()
    .promise()
    .then((data) => {
        console.log(data)
        if (data.Buckets != null) {
            for (var i = 0; i < data.Buckets.length; i++) {
                console.log(`Bucket Name: ${data.Buckets[i].Name}`);
            }
            logDone();
        }
    })
    .catch((logError));
}

// Retrieve the list of contents for a bucket
function getBucketContents(bucketName) {
    console.log(`Retrieving bucket contents from: ${bucketName}`);
    return cos.listObjects(
        {Bucket: bucketName},
    ).promise()
    .then((data) => {
        if (data != null && data.Contents != null) {
            for (var i = 0; i < data.Contents.length; i++) {
                var itemKey = data.Contents[i].Key;
                var itemSize = data.Contents[i].Size;
                console.log(`Item: ${itemKey} (${itemSize} bytes).`)
            }
            logDone();
        }    
    })
    .catch(logError);
}

// Retrieve a particular item from the bucket
function getItem(bucketName, itemName) {
    console.log(`Retrieving item from bucket: ${bucketName}, key: ${itemName}`);
    return cos.getObject({
        Bucket: bucketName, 
        Key: itemName
    }).promise()
    .then((data) => {
        if (data != null) {
            console.log('File Contents: ' + Buffer.from(data.Body).toString());
            logDone();
        }    
    })
    .catch(logError);
}

// Create new bucket
function createBucket(bucketName) {
    console.log(`Creating new bucket: ${bucketName}`);
    return cos.createBucket({
        Bucket: bucketName,
        CreateBucketConfiguration: {
          LocationConstraint: COS_STORAGE_CLASS
        },        
    }).promise()
    .then((() => {
        console.log(`Bucket: ${bucketName} created!`);
        logDone();
    }))
    .catch(logError);
}

// Create new text file
function createTextFile(bucketName, itemName, fileText) {
    console.log(`Creating new item: ${itemName}`);
    return cos.putObject({
        Bucket: bucketName, 
        Key: itemName, 
        Body: fileText
    }).promise()
    .then(() => {
        console.log(`Item: ${itemName} created!`);
        logDone();
    })
    .catch(logError);
}

// Delete item
function deleteItem(bucketName, itemName) {
    console.log(`Deleting item: ${itemName}`);
    return cos.deleteObject({
        Bucket: bucketName,
        Key: itemName
    }).promise()
    .then(() => {
        console.log(`Item: ${itemName} deleted!`);
        logDone();
    })
    .catch(logError);
}

// Delete bucket
function deleteBucket(bucketName) {
    console.log(`Deleting bucket: ${bucketName}`);
    return cos.deleteBucket({
        Bucket: bucketName
    }).promise()
    .then(() => {
        console.log(`Bucket: ${bucketName} deleted!`);
        logDone();
    })
    .catch(logError);
}

// Multi part upload
function multiPartUpload(bucketName, itemName, filePath) {
    var uploadID = null;

    if (!fs.existsSync(filePath)) {
        logError(new Error(`The file \'${filePath}\' does not exist or is not accessible.`));
        return;
    }

    return new Promise(function(resolve, reject) {
        console.log(`Starting multi-part upload for ${itemName} to bucket: ${bucketName}`);
        return cos.createMultipartUpload({
            Bucket: bucketName,
            Key: itemName
        }).promise()
        .then((data) => {
        uploadID = data.UploadId;

        //begin the file upload
        fs.readFile(filePath, (e, fileData) => {
            //min 5MB part
            var partSize = 1024 * 1024 * 5;
            var partCount = Math.ceil(fileData.length / partSize);

            async.timesSeries(partCount, (partNum, next) => {
                var start = partNum * partSize;
                var end = Math.min(start + partSize, fileData.length);

                partNum++;

                console.log(`Uploading to ${itemName} (part ${partNum} of ${partCount})`);

                cos.uploadPart({
                    Body: fileData.slice(start, end),
                    Bucket: bucketName,
                    Key: itemName,
                    PartNumber: partNum,
                    UploadId: uploadID
                }).promise()
                .then((data) => {
        next(e, {ETag: data.ETag, PartNumber: partNum});
                })
                .catch((e) => {
                    cancelMultiPartUpload(bucketName, itemName, uploadID);
                        logError(e);
                        reject(e);
                    });
                }, (e, dataPacks) => {
                    cos.completeMultipartUpload({
                    Bucket: bucketName,
                    Key: itemName,
                    MultipartUpload: {
                        Parts: dataPacks
                    },
                    UploadId: uploadID
                }).promise()
                .then(() => {
        logDone();
                        resolve();
                    })
                    .catch((e) => {
                    cancelMultiPartUpload(bucketName, itemName, uploadID);
                        logError(e);
                        reject(e);
                    });
                });
            });
        })
        .catch((e) => {
                    logError(e);
            reject(e);
        });
    });
}

function cancelMultiPartUpload(bucketName, itemName, uploadID) {
    return cos.abortMultipartUpload({
        Bucket: bucketName,
        Key: itemName,
        UploadId: uploadID
    }).promise()
    .then(() => {
        console.log(`Multi-part upload aborted for ${itemName}`);
    })
    .catch(logError);
}

// Constants for IBM COS values
const COS_ENDPOINT = "s3.eu-de.cloud-object-storage.appdomain.cloud";  // example: s3.us-south.cloud-object-storage.appdomain.cloud
const COS_API_KEY_ID = "nAg5hDvZppW4pcIc99GQ5mdh-8NbfpzVd3XzsBasneD5";
const COS_AUTH_ENDPOINT = "https://iam.cloud.ibm.com/identity/token";
const COS_SERVICE_CRN = "crn:v1:bluemix:public:iam-identity::a/baf52389f8564282bb3c67ccab31bcc8::serviceid:ServiceId-074b2b89-f35f-4009-afaf-987d01e76785";
const COS_STORAGE_CLASS = "eu-de-standard";

// Init IBM COS library
var config = {
    endpoint: COS_ENDPOINT,
    apiKeyId: COS_API_KEY_ID,
    ibmAuthEndpoint: COS_AUTH_ENDPOINT,
    serviceInstanceId: COS_SERVICE_CRN,
};

var cos = new ibm.S3(config);

// Main app
function main() {
    try {

        var bucketName = 'cloud-object-storage-6f-cos-standard-fjc'

        // var params = {
        //     Bucket: bucketName /* required */
        // };
        // cos.headBucket(params, function(err, data) {
        //   if (err) console.log(err, err.stack); // an error occurred
        //   else     console.log(data);           // successful response
        // });

        // var newBucketName = "js.bucket." + getUUID();
        var newTextFileName = "js_file_" + getUUID() + ".txt";
        var newTextFileContents = "This is a test file from Node.js code sample!!!";
        var newLargeFileName = "js_large_file_" + getUUID() + ".bin";
        var newLargeFileSize = 1024 * 1024 * 20;

        createTextFile(bucketName, newTextFileName, newTextFileContents) // create a new bucket
            .then(() => getBucketContents(bucketName)) // get the list of files from the new bucket
            .then(() => getItem(bucketName, newTextFileName)) // get the text file contents
            .then(() => generateBigRandomFile(newLargeFileName, newLargeFileSize)) // create a new local binary file that is 20 MB
            .then(() => multiPartUpload(bucketName, newLargeFileName, newLargeFileName)) // upload the large file using transfer manager
            .then(() => getBucketContents(bucketName)) // get the list of files from the new bucket
            .then(() => deleteItem(bucketName, newLargeFileName)) // remove the large file
            .then(() => deleteItem(bucketName, newTextFileName)) // remove the text file
    }
    catch(ex) {
        logError(ex);
    }
}

// upload the file specified by the filepath
function saveFileInBucket(filePath) {
    try {
        var bucketName = 'cloud-object-storage-6f-cos-standard-fjc'
        multiPartUpload(bucketName, filePath, filePath)
    } catch (err) {
        logError(err)
    }
}

function createMedia(req, res, next) {
    // TODO : save in media in db aswell as uploading the file
    var fileName = req.body.fileName
    var fileBuffer = req.body.fileBuffer
    fs.writeFile(fileName, fileBuffer, function (err) {
        if (err) {
            res.status(500).json({
                status: 'Error',
                message: `Error creating the temporary file! : ${err}`
            })
        } else {
            try {
                var bucketName = 'cloud-object-storage-6f-cos-standard-fjc'
                multiPartUpload(bucketName, fileName, fileName).then(function () {
                    fs.unlink(fileName, function (error) {
                        if (error) {
                            res.status(500).json({
                                status: 'Error',
                                message: 'Error removing the temporary file!'
                            })
                        } else {
                            res.status(200).json({
                                status: 'Success',
                                message: 'Succesfully uploaded image onto server bucket!'
                            })
                        }
                    })  
                })
            } catch (err) {
                res.status(500).json({
                    status: 'Error',
                    message: 'Error removing uploading onto bucket!'
                })
            }
        }
    });
    
}

// main();

module.exports = {
    createMedia: createMedia
}