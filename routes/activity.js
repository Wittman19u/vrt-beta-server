var express = require('express');
var hotelController = require('../controllers/hotels');
var router = express.Router();

// TODO ADD HOTEL DEFINITION


/**
 * @swagger
 * definitions:
 *   Hotel:
 *     properties:
 *       hotelId:
 *         type: string
 *       name:
 *         type: string
 *       distance:
 *         type: string
 *       distanceUnit:
 *         type: string
 *       street:
 *         type: string
 *       zipcode:
 *         type: string
 *       city:
 *         type: string
 *       countryCode:
 *         type: string
 *       latitude:
 *         type: number
 *       longitude:
 *         type: number
 *       price:
 *         type: string
 *       email:
 *         type: string
 *         format: email
 *       web:
 *         type: string
 *         format: uri
 *       phone:
 *         type: string
 *       linkImg:
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
 * /api/hotels:
 *   get:
 *     tags:
 *       - Hotels
 *     description: Returns hotels in this Area (16 max)
 *     summary: Returns hotels in this Area (16 max)
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: latitude
 *         description: Search around a geographical point. The latitude is specified in decimal degrees.\n Example: 52.5238.\n Should be used together with longitude+radius+radiusUnit
 *         in: query
 *         required: true
 *         type: number
 *       - name: longitude
 *         description: Search around a geographical point. The longitude is specified in decimal degrees.\n Example: 13.3835.\n Should be used together with longitude+radius+radiusUnit
 *         in: query
 *         required: true
 *         type: number *
 *       - name: radius
 *         description: Search radius
 *         in: query
 *         type: integer
 *         default: 5
 *       - name: radiusunit
 *         description: radius unit
 *         in: query
 *         type: string
 *         default: 'KM'
 *       - name: checkindate
 *         description: check-in date of the stay (hotel local date). Format YYYY-MM-DD.\n The lowest accepted value is the present date (no dates in the past).\n If not present, the default value will be today's date in the GMT timezone.
 *         in: query
 *         required: true
 *         type: string
 *         format: date
 *       - name: checkoutdate
 *         description: check-out date of the stay (hotel local date). Format YYYY-MM-DD.\n The lowest accepted value is checkInDate+1. If not present, it will default to checkInDate + 1
 *         in: query
 *         required: true
 *         type: string
 *         format: date
 *       - name: roomquantity
 *         description: number of rooms (1-9)
 *         in: query
 *         required: true
 *         type: integer
 *         minimum: 1
 *         maximum: 9
 *         default: 1
 *       - name: adults
 *         description: number of adult guests (1-9) per room
 *         in: query
 *         required: true
 *         type: integer
 *         minimum: 1
 *         maximum: 9
 *         default: 1
 *       - name: childAges
 *         description: Comma separated list of ages of each child at the time of check-out from the hotel.\n If several children have the same age, their ages should be repeated in the list
 *         in: query
 *         required: true
 *         type: Array
 *           items:
 *             type: integer
 *       - name: lang
 *         description: Requested language of descriptive texts. \n Examples: FR , fr , fr-FR.\nIf a language is not avaiable the text will be returned in english. \nISO language code (https://www.iso.org/iso-639-language-codes.html)
 *         in: query
 *         required: true
 *         type: string
 *         default: 'fr-FR'
 *       - name: Currency
 *         description: Use this parameter to request a specific currency. \nISO currency code (http://www.iso.org/iso/home/standards/currency_codes.htm). \nIf a hotel does not support the requested currency, the prices for the hotel will be returned in the local currency of the hotel and instead a currency conversion rate will be added in the dictionary.\nExample: EUR
 *         in: query
 *         required: true
 *         type: string
 *         default: 'EUR'
 *       - name: pricerange
 *         description: filter hotel offers by price per night interval (ex: 200-300 or -300 or 100). \nIt is mandatory to include a currency when this field is set.\nNote: a margin of +/- 10% is applied on the daily price
 *         in: query
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: An array of hotels
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
 *               example: Retrieved hotels
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/definitions/Hotel'
 *       400:
 *         description:  "Resource not found"
 *         schema:
 *           type: object
 *           properties:
 *              code:
 *                type: integer
 *                example: 61
 *              title:
 *                type: string
 *                example: Resource not found
 *              detail:
 *                type: string
 *                example: The targeted resource doesn't exist
 *              status:
 *                type: integer
 *                example: 400
 */
router.get('/hotels', hotelController.getHotels);

/**
 * @swagger
 * /api/hotels/{id}:
 *   get:
 *     tags:
 *       - Hotels
 *     description: Returns informations of a single Hotel
 *     summary: Returns informations of a single Hotel
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id
 *         description: Amadeus Property Code (8 chars).\n Example: BGMILBGB
 *         in: path
 *         required: true
 *         type: integer
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
 *               example: Retrieved hotels
 *             data:
 *               type: object
 *               $ref: '#/definitions/Hotel'
 */
router.get('/:id', hotelController.getHotelsOffer);

/**
 * @swagger
 * /api/hotels/offer/{id}:
 *   get:
 *     tags:
 *       - Hotels
 *     description: Returns informations of a single Hotel
 *     summary: Returns informations of a single Hotel
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id
 *         description: Amadeus Property Code (8 chars).\n Example: BGMILBGB
 *         in: path
 *         required: true
 *         type: integer
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
 *               example: Retrieved hotels
 *             data:
 *               type: object
 *               $ref: '#/definitions/Hotel'
 */
router.get('/offer/:id', hotelController.getOffer)

module.exports = router;