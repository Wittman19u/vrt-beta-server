var express = require('express');
var messageController = require('../controllers/messages');
var router = express.Router();

/**
 * @swagger
 * definitions:
 *   Message:
 *     properties:
 *       email:
 *         type: string
 *         format: email
 *       subject:
 *         type: string
 *       name:
 *         type: string
 *       description:
 *         type: string
 *     required:
 *       - email
 *       - subject
 *       - description
 */

/**
 * @swagger
 * /api/messages:
 *   post:
 *     tags:
 *       - Messages
 *     description: Send a message to techs
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: message
 *         description: Fields for new message resource
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Message'
 *     responses:
 *       200:
 *         description: Successfully message sent
 */
router.post('/', messageController.createMessage);

module.exports = router;
