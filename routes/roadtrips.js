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
 *       departurelongitude:
 *         type: number
 *         format: double
 *       departurelatitude:
 *         type: number
 *         format: double
 *       departuregeom:
 *         description: POSTGIS POINT object
 *         type: object
 *       arrivallongitude:
 *         type: number
 *         format: double
 *       arrivallatitude:
 *         type: number
 *         format: double
 *       arrivalgeom:
 *         description: POSTGIS POINT object
 *         type: object
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
 *       - departurelongitude
 *       - departurelatitude
 *       - arrivallongitude
 *       - arrivallatitude
 * 
 *   Waypoint:
 *     type: object
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
 * 
 *   Participate:
 *     properties:
 *       id:
 *         type: integer
 *       promoter:
 *         type: boolean
 *       roadtrip_id:
 *         type: integer
 *       account_id:
 *         type: integer
 *       status:
 *         type: integer
 *         description: 1 if owner, 2 if is participating, 3 if invited
 *     required:
 *       - id
 *       - promoter
 *       - account_id
 *       - roadtrip_id

 *   RoadtripWithWaypoints:
 *     type: object
 *     required:
 *       - roadtrip
 *       - account_id
 *     properties:
 *       roadtrip:
 *         $ref: '#/definitions/Roadtrip'
 *       account_id:
 *         type: integer
 *         description: id of the user creating the roadtrip
 *       waypoints:
 *         description: Waypoints list
 *         type: array
 *         items:
 *           type: object
 *           $ref: '#/definitions/Waypoint'
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
 *       500:
 *         description: Missing/incorrect parameters or database failure
 */
router.post('/', roadtripController.createRoadtrip);

/**
 * @swagger
 * /api/roadtrips/duplicate/{id}:
 *   post:
 *     tags:
 *       - Roadtrips
 *     description: Duplicates a new roadtrip with a new user
 *     produces:
 *       - application/json
 *     security:
 *       - authorisationJWT: []
 *     parameters:
 *       - name: id
 *         description: Id of the roadtrip to duplicate
 *         in: path
 *         required: true
 *         type: integer
 *     responses:
 *       200:
 *         description: Successfully created
 *       500:
 *         description: Missing/incorrect parameters or database failure
 */
router.post('/duplicate/:id', roadtripController.duplicateRoadtrip);

/**
 * @swagger
 * /api/roadtrips/user:
 *   get:
 *     tags:
 *       - Roadtrips
 *     description: Returns every roadtrip the user is participating in as well as their respective participants.
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
 *       - name: status
 *         description: Restrain the results to roadtrips of this specific status
 *         in: query
 *         required: false
 *         type: integer
 *       - name: invited
 *         description: Restrain the results to roadtrips the user is invited to
 *         in: query
 *         required: false
 *         type: boolean
 *     responses:
 *       200:
 *         description: A list of roadtrips. There is also an account and participate columns containing the informations of the participants
 *         schema:
 *           type: object
 *           properties:
 *             roadtrips:
 *               type: array
 *               items:
 *                 $ref: '#/definitions/Roadtrip'
 *             participates:
 *               type: array
 *               items:
 *                 $ref: '#/definitions/Participate'
 *             accounts:
 *               type: array
 *               items:
 *                 $ref: '#/definitions/User'
 */
router.get('/user', roadtripController.getUserRoadtrips);

/**
 * @swagger
 * /api/roadtrips/public:
 *   get:
 *     tags:
 *       - Roadtrips
 *     description: Returns every public roadtrip and the account of their respective promoters.
 *     produces:
 *       - application/json
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
 *         description: A list of roadtrips. There is also an account and participate columns containing the informations of the promoter
 *         schema:
 *           type: object
 *           properties:
 *             roadtrips:
 *               type: array
 *               items:
 *                 $ref: '#/definitions/Roadtrip'
 *             participates:
 *               type: array
 *               items:
 *                 $ref: '#/definitions/Participate'
 *             accounts:
 *               type: array
 *               items:
 *                 $ref: '#/definitions/User'
 */
router.get('/public', roadtripController.getPublicRoadtrips);

/**
 * @swagger
 * /api/roadtrips/{id}:
 *   get:
 *     tags:
 *       - Roadtrips
 *     description: Returns a roadtrip.
 *     produces:
 *       - application/json
 *     security:
 *       - authorisationJWT: []
 *     parameters:
 *       - name: id
 *         description: Roadtrip's id
 *         in: path
 *         required: true
 *         type: integer
 *     responses:
 *       200:
 *         description: A single roadtrip. There is a "waypoints" attribute containing the associated waypoints, a "visits" for visits, and "pois" for pois
 *         schema:
 *           $ref: '#/definitions/Roadtrip'
 */
router.get('/:id', roadtripController.getRoadtripDetails);

/**
 * @swagger
 * /api/roadtrips/participate/{id}:
 *   put:
 *     tags:
 *       - Roadtrips
 *     description: Joins a roadtrip.
 *     produces:
 *       - application/json
 *     security:
 *       - authorisationJWT: []
 *     parameters:
 *       - name: id
 *         description: Roadtrip's id
 *         in: path
 *         required: true
 *         type: integer
 *       - name: accept
 *         description: true if he accepts invite, false if he refuses
 *         in: query
 *         required: true
 *         type: boolean
 *     responses:
 *       200:
 *         description: The user succesfully joined the roadtrip
 *         schema:
 *           $ref: '#/definitions/Roadtrip'
 */
router.put('/participate/:id', roadtripController.participateToRoadtrip);

/**
 * @swagger
 * /api/roadtrips/{id}:
 *   put:
 *     tags:
 *       - Roadtrips
 *     description: Updates a single roadtrip
 *     produces:
 *       - application/json
 *     security:
 *       - authorisationJWT: []
 *     parameters:
 *       - name: id
 *         description: The id of the roadtrip
 *         in: path
 *         required: true
 *         type: integer
 *       - name: roadtrip
 *         description: The updated roadtrip
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Roadtrip'
 *     responses:
 *       200:
 *         description: Successfully updated
 *       403:
 *         description: Missing authorization / The user does not participate in the roadtrip
 *       500:
 *         description: Database query error
 */
router.put('/:id', roadtripController.updateRoadtrip);

module.exports = router;