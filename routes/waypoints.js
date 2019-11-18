var express = require('express');
var waypointController = require('../controllers/waypoints');
var router = express.Router();

/**
 * @swagger
 * definitions:
 *   Waypoint:
 *     properties:
 *       id:
 *         type: integer
 *       waypoint_id:
 *         type: integer
 *       itinerary_id:
 *         type: integer
 *     required:
 *       - waypoint_id
 *       - itinerary_id
 */

/**
 * @swagger
 * /api/waypoints:
 *   get:
 *     tags:
 *       - Waypoints
 *     description: Returns all waypoints
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: limit
 *         description: Waypoint's limit number
 *         in: query
 *         type: integer
 *         default: 16
 *     responses:
 *       200:
 *         description: An array of waypoints
 *         schema:
 *           $ref: '#/definitions/Waypoint'
 */
router.get('/', waypointController.getAllWaypoints);


/**
 * @swagger
 * /api/waypoints/{id}:
 *   get:
 *     tags:
 *       - Waypoints
 *     description: Returns a single waypoint
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id
 *         description: Waypoint's id
 *         in: path
 *         required: true
 *         type: integer
 *     responses:
 *       200:
 *         description: A single waypoint
 *         schema:
 *           $ref: '#/definitions/Waypoint'
 */
router.get('/:id', waypointController.getSingleWaypoint);


/**
 * @swagger
 * /api/waypoints:
 *   post:
 *     tags:
 *       - Waypoints
 *     description: Creates a new waypoint
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: waypoint
 *         description: Fields for new Waypoint resource
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Waypoint'
 *     responses:
 *       200:
 *         description: Successfully created
 */
router.post('/', waypointController.createWaypoint);


/**
 * @swagger
 * /api/waypoints/{id}:
 *   put:
 *     tags:
 *       - Waypoints
 *     description: Updates a single waypoint
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id
 *         description: Waypoint's id
 *         in: path
 *         required: true
 *         type: integer
 *       - name: waypoint
 *         description: Fields for Waypoint resource
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Waypoint'
 *     responses:
 *       200:
 *         description: Successfully updated
 */
router.put('/:id', waypointController.updateWaypoint);


/**
 * @swagger
 * /api/waypoints/{id}:
 *   delete:
 *     tags:
 *       - Waypoints
 *     description: Deletes a single waypoint
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id
 *         description: Waypoint's id
 *         in: path
 *         required: true
 *         type: integer
 *     responses:
 *       200:
 *         description: Successfully deleted
 */
router.delete('/:id', waypointController.removeWaypoint);

module.exports = router;