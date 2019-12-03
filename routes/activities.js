var express = require('express');
var activityController = require('../controllers/activities');
var router = express.Router();

// TODO ADD HOTEL DEFINITION


/**
 * @swagger
 * definitions:
 *   Activity:
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
 *       category:
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
 * /api/activities:
 *   get:
 *     tags:
 *       - Activities
 *     description: Returns Activities in this Area (16 max)
 *     summary: Returns Activities in this Area (16 max)
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: north
 *         required: true
 *         in: query
 *         type: number
 *         description: Activity's bound north (example 48.721093728486146)
 *         default: 48.721093728486146
 *       - name: south
 *         required: true
 *         in: query
 *         type: number
 *         description: Activity's bound south (example 48.62428582180533)
 *         default: 48.62428582180533
 *       - name: east
 *         required: true
 *         in: query
 *         type: number
 *         description: Activity's bound east (example 6.273365020751953)
 *         default: 6.273365020751953
 *       - name: west
 *         required: true
 *         in: query
 *         type: number
 *         description: Activity's bound west (example 6.099987030029298)
 *         default: 6.099987030029298
 *       - name: startDate
 *         in: query
 *         type: string
 *         description: Date time start (if empty = now() ) YYYY-MM-DD
 *         format: date
 *       - name: endDate
 *         in: query
 *         type: string
 *         description: Date time end (if empty = Tomorrow() ) YYYY-MM-DD
 *         format: date
 *       - name: currency
 *         description: |
 *           Use this parameter to request a specific currency.
 *           ISO currency code (http://www.iso.org/iso/home/standards/currency_codes.htm).
 *           If a hotel does not support the requested currency, the prices for the hotel will be returned in the local currency of the hotel and instead a currency conversion rate will be added in the dictionary.
 *           Example EUR
 *         in: query
 *         type: string
 *         default: EUR
 *       - name: categories
 *         in: query
 *         description: list of category filters for a destination see (/service/taxonomy/categories Viator API)
 *         type: Array
 *         items:
 *           type: integer
 *     responses:
 *       200:
 *         description: An array of activities
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
 *               example: Retrieved activities
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/definitions/Activity'
 */
router.get('/', activityController.getActivities);

/**
 * @swagger
 * /api/activities/{id}:
 *   get:
 *     tags:
 *       - Activities
 *     description: Returns informations of a single Hotel
 *     summary: Returns informations of a single Hotel
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id
 *         description: |
 *           Viator Property Code.
 *           Example : 5010SYDNEY
 *         in: path
 *         required: true
 *         type: string
 *       - name: currency
 *         description: |
 *           Use this parameter to request a specific currency.
 *           ISO currency code (http://www.iso.org/iso/home/standards/currency_codes.htm).
 *           If a hotel does not support the requested currency, the prices for the hotel will be returned in the local currency of the hotel and instead a currency conversion rate will be added in the dictionary.
 *           Example EUR
 *         in: query
 *         type: string
 *         default: EUR
 *     responses:
 *       200:
 *         description: A single hotel
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
 *               example: Retrieved activities
 *             data:
 *               type: object
 *               $ref: '#/definitions/Hotel'
 */
router.get('/:id', activityController.getActivityDetails);

// /**
//  * @swagger
//  * /api/activities/offer/{id}:
//  *   get:
//  *     tags:
//  *       - Activities
//  *     description: Returns informations of a single Hotel
//  *     summary: Returns informations of a single Hotel
//  *     produces:
//  *       - application/json
//  *     parameters:
//  *       - name: id
//  *         description: |
//  *           Amadeus Property Code (8 chars).
//  *           Example: BGMILBGB
//  *         in: path
//  *         required: true
//  *         type: integer
//  *     responses:
//  *       200:
//  *         description: A single hotel
//  *         schema:
//  *           type: object
//  *           properties:
//  *             status:
//  *               type: string
//  *               example: success
//  *             itemsNumber:
//  *               type: integer
//  *             message:
//  *               type: string
//  *               example: Retrieved activities
//  *             data:
//  *               type: object
//  *               $ref: '#/definitions/Hotel'
//  */
//router.get('/offer/:id', activityController.getOffer)

module.exports = router;