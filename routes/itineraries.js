var express = require('express');
var itineraryController = require('../controllers/itineraries');
var router = express.Router();

/**
 * @swagger
 * definitions:
 *   Itinerary:
 *     properties:
 *       id:
 *         type: integer
 *       departure:
 *         type: object
 *         properties:
 *           lng:
 *             type: number
 *           lat:
 *             type: number
 *       departuregeom:
 *         description: POSTGIS POINT object
 *         type: object
 *       departurestr:
 *         type: string
 *       arrival:
 *         type: object
 *         properties:
 *           lng:
 *             type: number
 *           lat:
 *             type: number
 *       arrivalgeom:
 *         description: POSTGIS POINT object
 *         type: object
 *       arrivalstr:
 *         type: string
 *       user_id:
 *         type: integer
 *       public:
 *         type: integer
 *         default: 2
 *         description: 1==yes, 2== no
 *       created_at:
 *         type: string
 *         format: date-time
 *       updated_at:
 *         type: string
 *         format: date-time
 *     required:
 *       - departure
 *       - arrival
 *       - public
 */

/**
 * @swagger
 * /api/itineraries:
 *   get:
 *     tags:
 *       - Itineraries
 *     description: Returns all itineraries
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: limit
 *         description: Itinerary's limit number
 *         in: query
 *         type: integer
 *         default: 16
 *     responses:
 *       200:
 *         description: An array of itineraries
 *         schema:
 *           $ref: '#/definitions/Itinerary'
 */
router.get('/', itineraryController.getAllItineraries);

/**
 * @swagger
 * /api/itineraries/myitineraries:
 *   get:
 *     tags:
 *       - Itineraries
 *     description: Returns personal user's itineraries
 *     security:
 *       - bearerAuth: []
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: An array of itineraries
 *         schema:
 *           $ref: '#/definitions/Itinerary'
 */
router.get('/myitineraries', itineraryController.getMyItineraries);


/**
 * @swagger
 * /api/itineraries/{id}:
 *   get:
 *     tags:
 *       - Itineraries
 *     description: Returns a single itinerary
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id
 *         description: Itinerary's id
 *         in: path
 *         required: true
 *         type: integer
 *     responses:
 *       200:
 *         description: A single itinerary
 *         schema:
 *           $ref: '#/definitions/Itinerary'
 */
router.get('/:id', itineraryController.getSingleItinerary);


/**
 * @swagger
 * /api/itineraries:
 *   post:
 *     tags:
 *       - Itineraries
 *     description: Creates a new itinerary
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: itinerary
 *         description: Fields for new Itinerary resource
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Itinerary'
 *       - name: waypoints
 *         description: Waipoints list
 *         in: body
 *         type: array
 *         collectionFormat: csv
 *         items:
 *           type: integer
 *     responses:
 *       200:
 *         description: Successfully created
 */
router.post('/', itineraryController.createItinerary);


// /**
//  * @swagger
//  * /api/itineraries/{id}:
//  *   put:
//  *     tags:
//  *       - Itineraries
//  *     description: Updates a single itinerary
//  *     produces:
//  *       - application/json
//  *     requestBody:
//  *        parameters:
//  *          - name: itinerary
//  *            description: Fields for Itinerary resource
//  *            in: body
//  *            required: true
//  *            schema:
//  *              $ref: '#/definitions/Itinerary'
//  *     responses:
//  *       200:
//  *         description: Successfully updated
//  */
// router.put('/:id', itineraryController.updateItinerary);


/**
 * @swagger
 * /api/itineraries/{id}:
 *   delete:
 *     tags:
 *       - Itineraries
 *     description: Deletes a single itinerary
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id
 *         description: Itinerary's id
 *         in: path
 *         required: true
 *         type: integer
 *     responses:
 *       200:
 *         description: Successfully deleted
 */
router.delete('/:id', itineraryController.removeItinerary);

module.exports = router;