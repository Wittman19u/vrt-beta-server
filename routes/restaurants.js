var express = require('express');
var restaurantController = require('../controllers/restaurants');
var router = express.Router();

/**
 * @swagger
 * definitions:
 *   Restaurant:
 *     properties:
 *       id:
 *         type: integer
 *       source_id:
 *         type: string
 *       sourcetype:
 *         type: string
 *       label:
 *         type: string
 *       theme:
 *         type: string
 *       start:
 *         type: string
 *         format: date-time
 *       end:
 *         type: string
 *         format: date-time
 *       street:
 *         type: string
 *       zipcode:
 *         type: string
 *       city:
 *         type: string
 *       country:
 *         type: string
 *       latitude:
 *         type: number
 *       longitude:
 *         type: number
 *       geom:
 *         type: string
 *       email:
 *         type: string
 *         format: email
 *       web:
 *         type: string
 *         format: uri
 *       phone:
 *         type: string
 *       linkimg:
 *         type: string
 *         format: uri
 *       comment:
 *         type: string
 *       type:
 *         type: integer
 *       priority:
 *         type: integer
 *       visnumber:
 *         type: integer
 *       created_at:
 *         type: string
 *         format: date-time
 *       updated_at:
 *         type: string
 *         format: date-time
 *     required:
 *       - label
 *       - created_at
 *       - updated_at
 */

/**
 * @swagger
 * /api/restaurants:
 *   get:
 *     tags:
 *       - Restaurants
 *     description: Returns restaurants in this Area (16 max)
 *     summary: Returns restaurants in this Area (16 max)
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: north
 *         in: query
 *         type: number
 *         description: Restaurant's bound north (example 48.721093728486146)
 *         default: 48.721093728486146
 *       - name: south
 *         in: query
 *         type: number
 *         description: Restaurant's bound south (example 48.62428582180533)
 *         default: 48.62428582180533
 *       - name: east
 *         in: query
 *         type: number
 *         description: Restaurant's bound east (example 6.273365020751953)
 *         default: 6.273365020751953
 *       - name: west
 *         in: query
 *         type: number
 *         description: Restaurant's bound west (example 6.099987030029298)
 *         default: 6.099987030029298
 *       - name: latitude
 *         description: |
 *           Search around a geographical point. The latitude is specified in decimal degrees.
 *           Example: 49.117459
 *           Should be used together with longitude+radius+radiusUnit
 *         in: query
 *         type: number
 *         default: 49.117459
 *       - name: longitude
 *         description: |
 *           Search around a geographical point. The longitude is specified in decimal degrees.
 *           Example: 6.179013
 *           Should be used together with longitude+radius+radiusUnit
 *         in: query
 *         type: number
 *         default: 6.179013
 *       - name: radius
 *         description: Radius in meters
 *         in: query
 *         type: integer
 *         default: 5000
 *     responses:
 *       200:
 *         description: An array of restaurants
 *         schema:
 *           type: object
 *           properties:
 *             status:
 *               type: string
 *               example: success
 *             itemsNumber:
 *               type: integer
 *             message:
 *               type: string
 *               example: Retrieved restaurants
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/definitions/Restaurant'
 */
router.get('/', restaurantController.getRestaurants);

/**
 * @swagger
 * /api/restaurants/{id}:
 *   get:
 *     tags:
 *       - Restaurants
 *     description: Returns informations of a single Restaurant
 *     summary: Returns informations of a single Restaurant
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id
 *         description: Restaurant's id
 *         in: path
 *         required: true
 *         type: integer
 *     responses:
 *       200:
 *         description: A single restaurant
 *         schema:
 *           type: object
 *           properties:
 *             status:
 *               type: string
 *               example: success
 *             itemsNumber:
 *               type: integer
 *             message:
 *               type: string
 *               example: Retrieved restaurants
 *             data:
 *               type: object
 *               $ref: '#/definitions/Restaurant'
 */
router.get('/:id', restaurantController.getRestaurantDetails);


module.exports = router;
