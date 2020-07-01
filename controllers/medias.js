'use strict';

// Required libraries
const ibm = require('ibm-cos-sdk');
const fs = require('fs');
const async = require('async');
// to resize images
const im = require('imagemagick');
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

// Get url for a specific item
function getUrl(bucketName, itemName) {
    return cos.getObject({
        Bucket: bucketName,
        Key: itemName
    }).promise()
        .then((data) => {
            var params = { Bucket: bucketName, Key: itemName };
            var url = cos.getSignedUrl('getObject', params);
            console.log('The URL is', url);
            return url;
        })
        .catch(logError);
    // return (getItem(bucketName, itemName)
    //     .then(function() {
    //         var params = {Bucket: bucketName, Key: itemName};
    //         var url = cos.getSignedUrl('getObject', params);
    //         console.log('The URL is', url);
    //         return url;
    //     }))
    // var params = {Bucket: bucketName, Key: itemName};
    // var url = cos.getSignedUrl('getObject', params);
    // console.log('The URL is', url);
    // return url;
    // var promise = cos.getSignedUrlPromise('getObject', params);
    // promise.then(function(url) {
    //     console.log('The URL is', url);
    //     return url;
    // }, function(err) {
    //     console.error(err)
    //     return false
    // });
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
// const COS_ENDPOINT = "s3.eu-de.cloud-object-storage.appdomain.cloud";
// const COS_API_KEY_ID = "nAg5hDvZppW4pcIc99GQ5mdh-8NbfpzVd3XzsBasneD5";
// const COS_AUTH_ENDPOINT = "https://iam.cloud.ibm.com/identity/token";
// const COS_SERVICE_CRN = "crn:v1:bluemix:public:iam-identity::a/baf52389f8564282bb3c67ccab31bcc8::serviceid:ServiceId-074b2b89-f35f-4009-afaf-987d01e76785";
// const COS_STORAGE_CLASS = "eu-de-standard";
// const COS_SIGNATURE_VERSION = 'v4';
const COS_ENDPOINT = "s3.eu-de.cloud-object-storage.appdomain.cloud";
const COS_API_KEY_ID = "BoJC7SPPYPd0jn0EsBy5HzFX49GudaNy6zpkjtb2Y-vX";
const COS_AUTH_ENDPOINT = "https://iam.cloud.ibm.com/identity/token";
const COS_SERVICE_CRN = "crn:v1:bluemix:public:iam-identity::a/baf52389f8564282bb3c67ccab31bcc8::serviceid:ServiceId-e6a7234b-123b-40c8-8277-9dc57a37b762";
const COS_STORAGE_CLASS = "eu-de-standard";
const COS_SIGNATURE_VERSION = 'v4';
const COS_CREDENTIALS = new ibm.Credentials('6947c52f10de4a59a45924f014ccaa52', '9a116192bab7d438f4ecc6fa9cb5ce282c4acac4db9743f7', null)

// Init IBM COS library
var config = {
    endpoint: COS_ENDPOINT,
    apiKeyId: COS_API_KEY_ID,
    ibmAuthEndpoint: COS_AUTH_ENDPOINT,
    serviceInstanceId: COS_SERVICE_CRN,
    credentials: COS_CREDENTIALS,
    signatureVersion: COS_SIGNATURE_VERSION
};

var cos = new ibm.S3(config);

// returns true if png, gif, jpg or jpeg
function imageType(buffer) {
    var arr = (new Uint8Array(buffer)).subarray(0, 4);
    var header = "";
    for (var i = 0; i < arr.length; i++) {
        header += arr[i].toString(16);
    }
    let type = "unknown"
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
    return type
}

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
                var typeFile = imageType(file.data)
                if (typeFile.substring(0, 6) != 'image/') {
                    res.status(401).json({
                        status: 'Error',
                        message: `The file is not an image!`
                    })
                } else {
                    var fileName = user.id.toString() + '_' + new Date().toISOString() + '.' + typeFile.slice(6)
                    var fileNameSmall = 'small_' + fileName // we do a prefix instead of a suffix so we can access it later easily
                    var type = req.query.type
                    var publicStatus = parseInt(req.query.public)
                    var idCategory = parseInt(req.query.idCategory)
                    var idForeign = parseInt(req.query.idForeign)
                    fs.writeFile(fileName, file.data, function (err) {
                        if (err) {
                            res.status(500).json({
                                status: 'Error',
                                message: `Error creating the temporary file! : ${err}`
                            })
                        } else {
                            var widthPicture = 1280
                            var bucketName = 'cloud-object-storage-6f-cos-standard-fjc'
                            // we always resize the image, but if profile picture we go with 256
                            if (type == 'account' && idCategory == 1) {
                                widthPicture = 256
                                bucketName += '-account'
                                // make a small version aswell
                                im.resize({
                                    srcData: fs.readFileSync(fileName, 'binary'),
                                    width: 52
                                }, async function (err, stdout, stderr) {
                                    if (err) throw err
                                    fs.writeFileSync(fileNameSmall, stdout, 'binary');
                                    // upload small onto bucket
                                    await multiPartUpload(bucketName, fileNameSmall, fileNameSmall)
                                    fs.unlinkSync(fileNameSmall)
                                });
                            }
                            im.resize({
                                srcData: fs.readFileSync(fileName, 'binary'),
                                width: widthPicture
                            }, function (err, stdout, stderr) {
                                if (err) throw err
                                // remove the old file
                                fs.unlinkSync(fileName)
                                // write the resized one with the same name
                                fs.writeFileSync(fileName, stdout, 'binary');
                            });
                            try {
                                multiPartUpload(bucketName, fileName, fileName).then(function () {
                                    fs.unlink(fileName, function (error) {
                                        if (error) {
                                            res.status(500).json({
                                                status: 'Error',
                                                message: 'Error removing the temporary file!'
                                            })
                                        } else {
                                            let media = { title: fileName, filename: fileName, filepath: bucketName, filesize: file.size, type: typeFile, account_id: user.id, category_id: idCategory, public: publicStatus }
                                            switch (type) {
                                                case 'account':
                                                    break;
                                                case 'roadtrip':
                                                    media.roadtrip_id = idForeign
                                                    break;
                                                case 'poi':
                                                    media.poi_id = idForeign
                                                    break;
                                                default:
                                                    res.status(500).json({
                                                        status: 'Error',
                                                        message: `The type parameter ${type} does not correspond to account, roadtrip or poi`
                                                    })
                                            }
                                            db.any('INSERT INTO media ($1:name) VALUES($1:csv) RETURNING id;', [media]).then(function (rows) {
                                                let media_id = rows[0].id
                                                // if account and category 1 (profile picture), we update the foreign key on account
                                                if (type == 'account' && idCategory == 1) {
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

// Method to retrieve all media from the authenticated user
// TODO complete method, just a draft
// function getUserMediaPublic(req, res, next) {
//     // AJOUTER PASSPORT
//     // CHANGER POUR RECUPERER EN FONCTION DE LA RELATION AUSSI
//     // RAJOUTER PARAMETRE media.public = 1
//     db.any('SELECT media.id, media.filename, media.filepath, media.filesize, media.type, media.status_id, account.id FROM media INNER JOIN account ON media.account_id = account.id WHERE account.id = $1', [user.id]).then(function (medias) {
//         if (medias[0] == null) {
//             res.status(401).json({
//                 status: 'Error',
//                 message: 'No file exists for this account!'
//             })
//         } else {
//             try {
//                 let requestsItems = []
//                 medias.forEach(media => {
//                     requestsItems.push(getItem(media.filepath, media.filename))
//                 })
//                 Promise.all(requestsItems).then((data) => {
//                     console.log(data)
//                     res.status(200).json({
//                         status: 'Success',
//                         message: 'Succesfully retrieved media from db and file',
//                         data: { files: data, mediasInfo: medias }
//                     })
//                 })
//             } catch (err) {
//                 res.status(500).json({
//                     status: 'Error',
//                     message: 'Error retrieving item from bucket!'
//                 })
//             }
//         }
//     })
// }

// Get profile picture of a specific user
function getUserProfilePicture(req, res, next) {
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
            var accountId = req.params.id
            db.any('SELECT media.filename, media.filepath FROM media INNER JOIN account ON media.id = account.media_id WHERE account.id = $1', [accountId]).then(function (media) {
                if (media[0] == null) {
                    res.status(201).json({
                        status: 'Success',
                        message: 'The user does not have a profile picture'
                    })
                } else {
                    try {
                        getUrl(media[0].filepath, media[0].filename).then((data) => {
                            console.log(data)
                            res.status(200).json({
                                status: 'Success',
                                message: 'Succesfully retrieved file url',
                                profilePicture: data
                            })
                        })
                    } catch (err) {
                        res.status(500).json({
                            status: 'Error',
                            message: 'Error retrieving item from bucket!'
                        })
                    }
                }
            }).catch(function (err) {
                res.status(500).json({
                    status: 'Error',
                    message: `Error fetching profile picture : ${err}`
                })
            })
        }
    })(req, res, next);
}

// TODO create a method to get all media from one user/ one roadtrip / etc... ?

module.exports = {
    createMedia: createMedia,
    getUserProfilePicture: getUserProfilePicture,
    getUrl: getUrl
}