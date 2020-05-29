'use strict';

// Required libraries
const ibm = require('ibm-cos-sdk');
const fs = require('fs');
const async = require('async');
// db
const db = require('./db');
const passport = require('passport');

function logError(e) {
    console.log(`ERROR: ${e.code} - ${e.message}\n`);
}

function logDone() {
    console.log('DONE!\n');
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
        { Bucket: bucketName },
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
            console.log(data)
            return data
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

// Multi part upload
function multiPartUpload(bucketName, itemName, filePath) {
    var uploadID = null;

    if (!fs.existsSync(filePath)) {
        logError(new Error(`The file \'${filePath}\' does not exist or is not accessible.`));
        return;
    }

    return new Promise(function (resolve, reject) {
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
                                next(e, { ETag: data.ETag, PartNumber: partNum });
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

// Constants for IBM COS values
const COS_ENDPOINT = "s3.eu-de.cloud-object-storage.appdomain.cloud";
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

// returns true if png, gif, jpg or jpeg
function isImage(buffer) {
    var arr = (new Uint8Array(buffer)).subarray(0, 4);
    var header = "";
    for(var i = 0; i < arr.length; i++) {
        header += arr[i].toString(16);
    }
    let type = "uknown"
    switch (header) {
        case "89504e47":
            type = "image/png";
            break;
        case "47494638":
            type = "image/gif";
            break;
        case "ffd8ffdb":
        case "ffd8ffee":
        case "ffd8ffe0":
        case "ffd8ffe1":
        case "ffd8ffe2":
        case "ffd8ffe3":
        case "ffd8ffe8":
            // jpeg and jpg have the same signatures
            type = "image/jpeg";
            break;
    }
    return type.substring(0,6) == 'image/'
}

// TODO -> ADD public PARAMETER to method, and use it when inserting new media
// TODO -> POPULATE relation tables aswell
// TODO -> PENDANT L'INSERT, AJOUTER category POUR SPECIFIER LA CATEGORIE DU MEDIA (+ nouveau parametre)
function createMedia(req, res, next) {
    passport.authenticate('jwt', { session: false }, function (error, user, info) {
        if (user === false || error || info !== undefined) {
            let message = {
                status: 'error',
                error: error,
                user: user
            };
            if (info !== undefined) {
                message['message'] = info.message;
                message['info'] = info;
            }
            console.error(message);
            res.status(403).json(message);
        } else {
            if (!req.files) {
                res.status(401).json({
                    status: 'Error',
                    message: `No file uploaded !`
                })
            } else {
                var file = req.files.file
                console.log(file)
                if (!isImage(file.data)) {
                    res.status(401).json({
                        status: 'Error',
                        message: `The file is not an image!`
                    })
                } else {
                    var fileName = user.id.toString() + '_' + new Date().toISOString() + '.' + file.mimetype.slice(6)
                    var type = req.query.type
                    if (type == 'account') {
                        // TODO : compresser fichier (256px pour photo profil) -> resize
                    }
                    fs.writeFile(fileName, file.data, function (err) {
                        if (err) {
                            res.status(500).json({
                                status: 'Error',
                                message: `Error creating the temporary file! : ${err}`
                            })
                        } else {
                            try {
                                var bucketName = 'cloud-object-storage-6f-cos-standard-fjc'
                                if (type == 'account') {
                                    bucketName += '-account'
                                }
                                multiPartUpload(bucketName, fileName, fileName).then(function () {
                                    fs.unlink(fileName, function (error) {
                                        if (error) {
                                            res.status(500).json({
                                                status: 'Error',
                                                message: 'Error removing the temporary file!'
                                            })
                                        } else {
                                            let media = { title: fileName, filename: fileName, filepath: bucketName, filesize: file.size, type: file.mimetype, account_id: user.id }
                                            db.any('INSERT INTO media ($1:name) VALUES($1:csv) RETURNING id;', [media]).then(function (rows) {
                                                let media_id = rows[0].id
                                                // if account we insert into the account-media relation table
                                                if (type == 'account') {
                                                    db.none('UPDATE account SET media_id = $1 WHERE id = $2', [media_id, user.id]).then(function () {
                                                        res.status(200).json({
                                                            status: 'Success',
                                                            message: 'Succesfully uploaded image onto server bucket and updated user media!'
                                                        })
                                                    }).catch(function (err) {
                                                        res.status(500).json({
                                                            status: 'Error',
                                                            message: `Error updating account : ${err}`
                                                        })
                                                    })
                                                } else {
                                                // if poi we insert into the poi-media relation table
                                                    res.status(200).json({
                                                        status: 'Success',
                                                        message: 'Succesfully uploaded image onto server bucket!'
                                                    })
                                                }
                                            }).catch(function (err) {
                                                res.status(500).json({
                                                    status: 'Error',
                                                    message: `Error inserting into media : ${err}`
                                                })
                                            })
                                        }
                                    })
                                })
                            } catch (err) {
                                res.status(500).json({
                                    status: 'Error',
                                    message: 'Error uploading onto bucket!'
                                })
                            }
                        }
                    });
                }
            }
        }
    })(req, res, next);
}

// TODO complete method, just a draft
function getUserMediaPublic(req, res, next) {
    var accountId = req.params.id
    // CHANGER POUR RECUPERER EN FONCTION DE LA RELATION AUSSI
    // RAJOUTER PARAMETRE media.public = 1
    db.any('SELECT media.id, media.filename, media.filepath, media.filesize, media.type, media.status_id, account.id FROM media INNER JOIN account ON media.account_id = account.id WHERE account.id = $1', [accountId]).then(function (medias) {
        if (medias[0] == null) {
            res.status(401).json({
                status: 'Error',
                message: 'No file exists for this account!'
            })
        } else {
            try {
                let requestsItems = []
                medias.forEach(media => {
                    requestsItems.push(getItem(media.filepath, media.filename))
                })
                Promise.all(requestsItems).then((data) => {
                    console.log(data)
                    res.status(200).json({
                        status: 'Success',
                        message: 'Succesfully retrieved media from db and file',
                        data: {files: data, mediasInfo: medias}
                    })
                })
            } catch (err) {
                res.status(500).json({
                    status: 'Error',
                    message: 'Error retrieving item from bucket!'
                })
            }
        }
    })
}

// TODO complete method, just a draft
function getUserMediaAuthenticated(req, res, next) {
    // CHANGER POUR RECUPERER EN FONCTION DE LA RELATION AUSSI
    passport.authenticate('jwt', { session: false }, function (error, user, info) {
        if (user === false || error || info !== undefined) {
            let message = {
                status: 'error',
                error: error,
                user: user
            };
            if (info !== undefined) {
                message['message'] = info.message;
                message['info'] = info;
            }
            console.error(message);
            res.status(403).json(message);
        } else {
            db.any('SELECT media.id, media.filename, media.filepath, media.filesize, media.type, media.status_id, account.id FROM media INNER JOIN account ON account.media_id = media.id WHERE account.id = $1', [user.id]).then(function (media) {
                if (media[0] == null) {
                    res.status(401).json({
                        status: 'Error',
                        message: 'No file exists for this account!'
                    })
                } else {
                    try {
                        getItem(media[0].filepath, media[0].filename).then(function (data) {
                            console.log(data)
                            res.status(200).json({
                                status: 'Success',
                                message: 'Succesfully retrieved media from db and file',
                                data: {file: data, mediaInfo: media[0]}
                            })
                        })
                    } catch (err) {
                        res.status(500).json({
                            status: 'Error',
                            message: 'Error retrieving item from bucket!'
                        })
                    }
                }
            })
        }
    })(req, res, next);
}

// TODO complete method, just a draft
function getPoiMedia(req, res, next) {
    var poiId = req.params.id
    // CHANGER POUR RECUPERER EN FONCTION DE LA RELATION
    db.any('SELECT media.id, media.filename, media.filepath, media.filesize, media.type, media.status_id, account.id FROM media INNER JOIN account ON poi.media_id = media.id WHERE poi.id = $1', [poiId]).then(function (media) {
        if (media[0] == null) {
            res.status(401).json({
                status: 'Error',
                message: 'No file exists for this account!'
            })
        } else {
            try {
                getItem(media[0].filepath, media[0].filename).then(function (data) {
                    console.log(data)
                    res.status(200).json({
                        status: 'Success',
                        message: 'Succesfully retrieved media from db and file',
                        data: {file: data, mediaInfo: media[0]}
                    })
                })
            } catch (err) {
                res.status(500).json({
                    status: 'Error',
                    message: 'Error retrieving item from bucket!'
                })
            }
        }
    })
}

module.exports = {
    createMedia: createMedia,
    getUserMediaPublic: getUserMediaPublic,
    getUserMediaAuthenticated: getUserMediaAuthenticated,
    getPoiMedia: getPoiMedia
}