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
 *       category_id:
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
 *     parameters:
 *       - name: limit
 *         description: Limit of results returned
 *         in: query
 *         default: 10
 *         required: false
 *         type: integer
 *       - name: offset
 *         description: Offset in db
 *         in: query
 *         default: 0
 *         required: false
 *         type: integer
 *     responses:
 *       200:
 *         description: A list of alerts.
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/definitions/Alert'
 */
router.get('/user', alertController.getUserAlerts);

/**
 * @swagger
 * /api/alerts/{id}:
 *   delete:
 *     tags:
 *       - Alerts
 *     description: Deletes a single alert
 *     produces:
 *       - application/json
 *     security:
 *       - authorisationJWT: []
 *     parameters:
 *       - name: id
 *         description: Alert's id
 *         in: path
 *         required: true
 *         type: integer
 *     responses:
 *       200:
 *         description: Successfully deleted
 *       403:
 *         description: The user is not authenticated
 *       500:
 *         description: DB/login error
 */
router.delete('/:id', alertController.deleteAlert);

module.exports = router;