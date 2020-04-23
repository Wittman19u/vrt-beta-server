var express = require('express');
var roadtripController = require('../controllers/roadtrips');
var router = express.Router();

/**
 * @swagger
 * definitions:
 *   Roadtrip:
 *     type: object
 *     properties:
 *       id:
 *         type: integer
 *       title:
 *         type: string
 *       departure:
 *         type: string
 *       arrival:
 *         type: string
 *       start:
 *         type: string
 *         format: date-time
 *       end:
 *         type: string
 *         format: date-time
 *       distance:
 *         type: number
 *         format: double
 *       duration:
 *         type: integer
 *       hashtag:
 *         type: array
 *         items:
 *           type: string
 *       public:
 *         type: integer
 *         default: 2
 *         description: 1==yes, 2== no
 *       status_id:
 *         type: integer
 *         default: 3
 *         description: refers to the status table -> 1 is active, 2 is not active, 3 is draft
 *       created_at:
 *         type: string
 *         format: date-time
 *       updated_at:
 *         type: string
 *         format: date-time
 *     required:
 *       - title
 *       - departure
 *       - arrival
 *       - start
 *       - end
 * 
 *   WaypointApp:
 *     properties:
 *       id:
 *         type: integer
 *       label:
 *         type: string
 *       day:
 *         type: integer
 *       sequence:
 *         type: integer
 *       transport:
 *         description : JSON object containing all info related to the route
 *         type: object
 *       geom:
 *         description: POSTGIS POINT object
 *         type: object
 *       latitude:
 *         type: number
 *         format: double
 *       longitude:
 *         type: number
 *         format: double
 *       roadtrip_id:
 *         type: integer
 *       account_id:
 *         type: integer
 *     required:
 *       - label
 *       - day
 *       - sequence
 *       - transport
 *       - latitude
 *       - longitude
 *       - roadtrip_id

 *   RoadtripWithWaypoints:
 *     type: object
 *     required:
 *       - roadtrip
 *     properties:
 *       roadtrip:
 *         $ref: '#/definitions/Roadtrip'
 *       waypoints:
 *         description: Waypoints list
 *         type: array
 *         items:
 *           type: object
 *           $ref: '#/definitions/WaypointApp'
 */

/**
 * @swagger
 * /api/roadtrips:
 *   post:
 *     tags:
 *       - Roadtrips
 *     description: Creates a new roadtrip
 *     produces:
 *       - application/json
 *     security:
 *       - authorisationJWT: []
 *     parameters:
 *       - name: body
 *         in: body
 *         description: data to send {roadtrip, waypoints}
 *         required: true
 *         schema:
 *           $ref: '#/definitions/RoadtripWithWaypoints'
 *     responses:
 *       200:
 *         description: Successfully created
 */
router.post('/', roadtripController.createRoadtrip);

/**
 * @swagger
 * /api/roadtrips/myroadtrips:
 *   get:
 *     tags:
 *       - Roadtrips
 *     description: Returns a roadtrip
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id
 *         description: Roadtrip's id
 *         in: path
 *         required: true
 *         type: integer
 *     responses:
 *       200:
 *         description: A single roadtrip
 *         schema:
 *           $ref: '#/definitions/Roadtrip'
 */
router.get('/:id', roadtripController.getRoadtripDetails);

module.exports = router;