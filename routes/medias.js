var express = require('express');
var mediaController = require('../controllers/medias');
var router = express.Router();

/**
 * @swagger
 * /api/medias:
 *   post:
 *     tags:
 *       - Medias
 *     description: Creates a new media and save the file on the ibm server
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: body
 *         in: body
 *         description: data to send {fileName, fileBuffer}
 *         required: true
 *     responses:
 *       200:
 *         description: Successfully created
 *       500:
 *         description: Missing/incorrect parameters or database failure
 */
router.post('/', mediaController.createMedia);

module.exports = router;