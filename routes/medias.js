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
 *       - name: body
 *         in: body
 *         description: data to send {fileBuffer}
 *         required: true
 *         schema:
 *           $ref: '#/definitions/FileBuffer'
 *     responses:
 *       200:
 *         description: Successfully created
 *       500:
 *         description: Missing/incorrect parameters or database failure
 */
router.post('/', mediaController.createMedia);

module.exports = router;