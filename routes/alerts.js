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
 * /api/alerts/:
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
router.get('/', alertController.getUserAlerts);

/**
 * @swagger
 * /api/alerts/invite:
 *   post:
 *     tags:
 *       - Alerts
 *     description: Creates an alert, a notification and insert into participate to invite the user to a roadtrip
 *     produces:
 *       - application/json
 *     security:
 *       - authorisationJWT: []
 *     parameters:
 *       - name: userId
 *         description: id of user to invite
 *         in: query
 *         required: true
 *         type: integer
 *       - name: roadtripId
 *         description: id of the roadtrip we're inviting the user to
 *         in: query
 *         required: true
 *         type: integer
 *     responses:
 *       200:
 *         description: Succesfully inserted in db.
 */
router.post('/invite', alertController.sendInviteToRoadtrip);

/**
 * @swagger
 * /api/alerts/invite/newUser:
 *   post:
 *     tags:
 *       - Alerts
 *     description: Creates a new row for invited table and sends an email to the user to invited to register to the app
 *     produces:
 *       - application/json
 *     security:
 *       - authorisationJWT: []
 *     parameters:
 *       - name: email
 *         description: email of user to invite
 *         in: query
 *         required: true
 *         type: string
 *       - name: roadtripId
 *         description: id of the roadtrip we're inviting the user to
 *         in: query
 *         required: false
 *         type: integer
 *     responses:
 *       200:
 *         description: Succesfully inserted in db.
 */
router.post('/invite/newUser', alertController.sendInviteNewUser);

/**
 * @swagger
 * /api/alerts/:
 *   put:
 *     tags:
 *       - Alerts
 *     description: Updates the specified alerts to isread = true
 *     produces:
 *       - application/json
 *     security:
 *       - authorisationJWT: []
 *     parameters:
 *       - name: body
 *         description: array of ids, if not specified we update all alerts from user
 *         in: body
 *         required: false
 *         type: object
 *         properties:
 *           alertIds:
 *             type: array
 *             items:
 *               type: integer
 *     responses:
 *       200:
 *         description: Succesfully updated in db.
 */
router.put('/', alertController.updateAlert);

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