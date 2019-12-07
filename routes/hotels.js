var express = require('express');
var hotelController = require('../controllers/hotels');
var router = express.Router();

// TODO ADD HOTEL DEFINITION

// LIGHT: geocoordinates, hotel distance, city name, phone number, fax, address, postal code, country code, state code, ratings, 1 image
/**
 * @swagger
 * definitions:
 *   Hotel:
 *     properties:
 *       type:
 *         type: string
 *       dupeId:
 *         type: integer
 *       hotelId:
 *         type: string
 *       name:
 *         type: string
 *       rating:
 *         type: integer
 *       hotelDistance:
 *         type: object
 *         properties:
 *           distance:
 *             type: number
 *           distanceUnit:
 *             type: string
 *       address:
 *         type: object
 *         properties:
 *           lines:
 *             type: array
 *             items:
 *               type:string
 *           cityName:
 *             type: string
 *           countryCode:
 *             type: string
 *       contact:
 *         type: object
 *         properties:
 *           phone:
 *             type: number
 *           fax:
 *             type: string
 *           email:
 *             type: string
 *             format: email
 *       media:
 *         type: array
 *         items:
 *           type: object
 *           properties:
 *             uri:
 *               type: string
 *               format: uri
 *             category:
 *               type:string
 *       latitude:
 *         type: number
 *       longitude:
 *         type: number
 *       available:
 *         type: boolean
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
 *         description: |
 *           Search around a geographical point. The latitude is specified in decimal degrees.
 *           Example: 49.117459
 *           Should be used together with longitude+radius+radiusUnit
 *         in: query
 *         required: true
 *         type: number
 *         default: 49.117459
 *       - name: longitude
 *         description: |
 *           Search around a geographical point. The longitude is specified in decimal degrees.
 *           Example: 6.179013
 *           Should be used together with longitude+radius+radiusUnit
 *         in: query
 *         required: true
 *         type: number
 *         default: 6.179013
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
 *         description: |
 *           check-in date of the stay (hotel local date). Format YYYY-MM-DD.
 *           The lowest accepted value is the present date (no dates in the past).
 *           If not present, the default value will be today's date in the GMT timezone.
 *         in: query
 *         type: string
 *         format: date
 *       - name: checkoutdate
 *         description: |
 *           check-out date of the stay (hotel local date). Format YYYY-MM-DD.
 *           The lowest accepted value is checkInDate+1. If not present, it will default to checkInDate + 1
 *         in: query
 *         type: string
 *         format: date
 *       - name: roomquantity
 *         description: number of rooms (1-9)
 *         in: query
 *         type: integer
 *         minimum: 1
 *         maximum: 9
 *         default: 1
 *       - name: adults
 *         description: number of adult guests (1-9) per room
 *         in: query
 *         type: integer
 *         minimum: 1
 *         maximum: 9
 *         default: 1
 *       - name: childAges
 *         description: |
 *           Comma separated list of ages of each child at the time of check-out from the hotel.
 *           If several children have the same age, their ages should be repeated in the list
 *         in: query
 *         default: []
 *         type: Array
 *         items:
 *           type: integer
 *       - name: lang
 *         description: |
 *           Requested language of descriptive texts.
 *           Example: FR , fr , fr-FR.
 *           If a language is not avaiable the text will be returned in english.
 *           ISO language code [link](https://www.iso.org/iso-639-language-codes.html)
 *         in: query
 *         type: string
 *         default: 'fr-FR'
 *       - name: currency
 *         description: |
 *           Use this parameter to request a specific currency.
 *           ISO currency code (http://www.iso.org/iso/home/standards/currency_codes.htm).
 *           If a hotel does not support the requested currency, the prices for the hotel will be returned in the local currency of the hotel and instead a currency conversion rate will be added in the dictionary.
 *           Example: EUR
 *         in: query
 *         type: string
 *         default: EUR
 *       - name: pricerange
 *         description: |
 *           Filter hotel offers by price per night interval (ex: 200-300 or -300 or 100).
 *           It is mandatory to include a currency when this field is set.
 *           Note: a margin of +/- 10% is applied on the daily price
 *         in: query
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
 *         description:  Resource not found
 *         schema:
 *           type: object
 *           properties:
 *              code:
 *                type: integer
 *                example: 61
 *              error:
 *                type: object
 *              message:
 *                type: string
 *                example: The targeted resource doesn't exist
 *              status:
 *                type: integer
 *                example: 400
 */
router.get('/', hotelController.getHotels);

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
 *         description: |
 *           Amadeus Property Code (8 chars).
 *           Example: BGMILBGB
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
 *       400:
 *         description:  Resource not found
 *         schema:
 *           type: object
 *           properties:
 *              code:
 *                type: integer
 *                example: 61
 *              error:
 *                type: object
 *              message:
 *                type: string
 *                example: The targeted resource doesn't exist
 *              status:
 *                type: integer
 *                example: 400
 */
router.get('/:id', hotelController.getHotelOffer);

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
 *         description: |
 *           Amadeus Property Code (8 chars).
 *           Example: BGMILBGB
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
 *       400:
 *         description:  Resource not found
 *         schema:
 *           type: object
 *           properties:
 *              code:
 *                type: integer
 *                example: 61
 *              error:
 *                type: object
 *              message:
 *                type: string
 *                example: The targeted resource doesn't exist
 *              status:
 *                type: integer
 *                example: 400
 */
router.get('/offer/:id', hotelController.getOffer);



module.exports = router;