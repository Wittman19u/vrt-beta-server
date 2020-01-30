var express = require('express');
var directionController = require('../controllers/directions');
var router = express.Router();

/**
 * @swagger
 * /api/directions:
 *   get:
 *     tags:
 *       - Directions
 *     description: Retrieving navigation data
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: service
 *         description: Service to use {trip|route}
 *         in: query
 *         required: true
 *       - name: coordinates
 *         description: coordinates to use for calculation of itinerary
 *         in: query
 *         required: true
 *       - name: typeroute
 *         description: Profile to use {driving|cycling|walking}
 *         in: query
 *         required: true
 *     responses:
 *       200:
 *         description: Retrieved data from OSRM Server
 *         schema:
 *           type: object
 *           properties:
 *             status:
 *               type: string
 *               example: success
 *             message:
 *               type: string
 *               example: Retrieved data from OSRM Server!
 *             data:
 *               type: object
 */

router.get('/', directionController.getDirection);

module.exports = router;
