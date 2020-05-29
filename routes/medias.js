var express = require('express');
var mediaController = require('../controllers/medias');
var router = express.Router();

/**
 * @swagger
 * definitions:
 *   FileBuffer:
 *     type: object
 *     properties:
 *       fileBuffer:
 *         type: string
 *         format: byte
 *         description: Buffer for the image
 */

/**
 * @swagger
 * /api/medias:
 *   post:
 *     tags:
 *       - Medias
 *     description: Creates a new media and save the file on the ibm server
 *     produces:
 *       - application/json
 *     security:
 *       - authorisationJWT: []
 *     parameters:
 *       - name: file
 *         in: formData
 *         description: file to upload to media
 *         required: true
 *         type: file
 *         consumes: multipart/form-data
 *       - name: type
 *         in: query
 *         description: type of the media -> can be 'account' or 'poi'
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Successfully created
 *       401:
 *         description: No file or the file is not an image
 *       500:
 *         description: Missing/incorrect parameters or database failure
 */
router.post('/', mediaController.createMedia);

// /**
//  * @swagger
//  * /api/medias/user/public/{id}:
//  *   get:
//  *     tags:
//  *       - Medias
//  *     description: Retrieves the public media associated with account
//  *     produces:
//  *       - application/json
//  *     parameters:
//  *       - name: id
//  *         in: path
//  *         description: id of the account
//  *         required: true
//  *         type: integer
//  *     responses:
//  *       200:
//  *         description: Successfully retrieved image
//  *       401:
//  *         description: No file exists for the specified account
//  *       500:
//  *         description: Missing/incorrect parameters or database failure
//  */
// router.get('/user/public/:id', mediaController.getUserMediaPublic);

// /**
//  * @swagger
//  * /api/medias/user/{id}:
//  *   get:
//  *     tags:
//  *       - Medias
//  *     description: Retrieves all media associated with authenticated account
//  *     produces:
//  *       - application/json
//  *     security:
//  *       - authorisationJWT: []
//  *     responses:
//  *       200:
//  *         description: Successfully retrieved medias
//  *       401:
//  *         description: No file exists for the specified account
//  *       500:
//  *         description: Missing/incorrect parameters or database failure
//  */
// router.get('/user/public/:id', mediaController.getUserMediaAuthenticated);

module.exports = router;