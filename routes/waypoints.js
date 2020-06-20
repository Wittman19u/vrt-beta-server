var express = require('express');
var waypointController = require('../controllers/waypoints');
var router = express.Router();

// /**
//  * @swagger
//  * /api/waypointsbyitinerary/{itinerary}:
//  *   get:
//  *     tags:
//  *       - Waypoints
//  *     description: Returns all waypoints
//  *     produces:
//  *       - application/json
//  *     parameters:
//  *       - name: itinerary
//  *         description: Waypoint's list by itinerary
//  *         in: path
//  *         type: integer
//  *         required: true
//  *     responses:
//  *       200:
//  *         description: An array of waypoints
//  *         schema:
//  *           $ref: '#/definitions/Waypoint'
//  */
// router.get('/:itinerary', waypointController.getWaypointsByItinerary);


// /**
//  * @swagger
//  * /api/waypoints/{id}:
//  *   get:
//  *     tags:
//  *       - Waypoints
//  *     description: Returns a single waypoint
//  *     produces:
//  *       - application/json
//  *     parameters:
//  *       - name: id
//  *         description: Waypoint's id
//  *         in: path
//  *         required: true
//  *         type: integer
//  *     responses:
//  *       200:
//  *         description: A single waypoint
//  *         schema:
//  *           $ref: '#/definitions/Waypoint'
//  */
// router.get('/:id', waypointController.getSingleWaypoint);

/**
 * @swagger
 * /api/waypoints:
 *   post:
 *     tags:
 *       - Waypoints
 *     description: Creates a new waypoint
 *     produces:
 *       - application/json
 *     security:
 *       - authorisationJWT: []
 *     parameters:
 *       - name: body
 *         description: Fields for new Waypoint resource
 *         in: body
 *         type: object
 *         required:
 *           - waypoint
 *         properties:
 *           waypoint:
 *             $ref: '#/definitions/Waypoint'
 *     responses:
 *       200:
 *         description: Successfully created
 *       403:
 *         description: The user does not have rights to create the waypoint (he does not participate in the roadtrip)
 *       500:
 *         description: DB/login error
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
 *     security:
 *       - authorisationJWT: []
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
 *       403:
 *         description: The user does not have rights to update this waypoint
 *       500:
 *         description: DB/login error
 */
router.put('/:id', waypointController.updateWaypoint);


/**
 * @swagger
 * /api/waypoints/{id}:
 *   delete:
 *     tags:
 *       - Waypoints
 *     description: Deletes a single waypoint as well as its associated visits and comments
 *     produces:
 *       - application/json
 *     security:
 *       - authorisationJWT: []
 *     parameters:
 *       - name: id
 *         description: Waypoint's id
 *         in: path
 *         required: true
 *         type: integer
 *     responses:
 *       200:
 *         description: Successfully deleted
 *       403:
 *         description: The user does not have rights to remove this waypoint
 *       500:
 *         description: DB/login error
 */
router.delete('/:id', waypointController.removeWaypoint);

module.exports = router;