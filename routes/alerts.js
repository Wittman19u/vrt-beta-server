var express = require('express');
var alertController = require('../controllers/alerts');
var router = express.Router();

/**
 * @swagger
 * definitions:
 *   Alert:
 *     type: object
 *     properties:
 *       id:
 *         type: integer
 *       title:
 *         type: string
 *       message:
 *         type: string
 *       sender_id:
 *         type: integer
 *       recipient_id:
 *         type: integer
 *       roadtrip_id:
 *         type: integer
 *       isread:
 *         type: boolean
 */

/**
 * @swagger
 * /api/alerts/user:
 *   get:
 *     tags:
 *       - Alerts
 *     description: Returns every alert the user has received, ordered to get the unread alerts first
 *     produces:
 *       - application/json
 *     security:
 *       - authorisationJWT: []
 *     responses:
 *       200:
 *         description: A list of alerts.
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/definitions/Alert'
 */
router.get('/user', alertController.getUserAlerts);

module.exports = router;