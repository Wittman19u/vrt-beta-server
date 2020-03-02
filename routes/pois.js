var express = require('express');
var poiController = require('../controllers/pois');
var router = express.Router();

/**
 * @swagger
 * definitions:
 *   Poi:
 *     properties:
 *       id:
 *         type: integer
 *       source:
 *         type: string
 *       sourceid:
 *         type: string
 *       sourcetype:
 *         type: string
 *       sourcelastupdate:
 *         type: string
 *         format: data-time
 *       label:
 *         type: string
 *       sourcetheme:
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
 *       description:
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
 *       active:
 *         type: boolean
 *         default: 1
 *       profiles:
 *         type: object
 *       opening:
 *         type: object
 *       rating:
 *         type: number
 *       duration:
 *         type: integer
 *       price:
 *         type: number
 *       ocean:
 *         type: object
 *       pricerange:
 *         type: integer
 *       handicap:
 *         type: integer
 *       social:
 *         type: object
 *     required:
 *       - label
 *       - latitude
 *       - longitude
 *
 */

/**
 * @swagger
 * definitions:
 *   CreatePoi:
 *     properties:
 *       source:
 *         type: string
 *         default: 'Community'
 *       sourceid:
 *         type: integer
 *       sourcetype:
 *         type: string
 *         example: 'Restaurant'
 *       label:
 *         type: string
 *         example: 'Chez Claudio'
 *       sourcetheme:
 *         type: string
 *         example: 'Italian Restaurant'
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
 *       description:
 *         type: string
 *       type:
 *         type: integer
 *         description: 1 == Event, 2== POI (hotel, restaurant,...), 3 == product
 *         default: 2
 *       opening:
 *         type: object
 *         description: see schema.org
 *     required:
 *       - label
 *       - sourceid
 *       - latitude
 *       - longitude
 *
 */


// /**
//  * @swagger
//  * /api/pois:
//  *   get:
//  *     tags:
//  *       - Pois
//  *     description: Returns all pois
//  *     produces:
//  *       - application/json
//  *     parameters:
//  *       - name: limit
//  *         description: Poi's limit number
//  *         in: query
//  *         type: integer
//  *         default: 16
//  *     responses:
//  *       200:
//  *         description: An array of pois
//  *         schema:
//  *           $ref: '#/definitions/Poi'
//  */
// router.get('/', poiController.getAllPois);

/**
 * @swagger
 * /api/pois/findByLabel:
 *   get:
 *     tags:
 *       - Pois
 *     description: Returns POIs with query in label field
 *     summary: Returns POIs with query in label field
 *     security:
 *       - authorisationJWT: []
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: query
 *         required: true
 *         in: query
 *         type: string
 *         description: text to find in label
 *       - name: active
 *         in: query
 *         type: string
 *         description: select  {all/true/false} active pois
 *     responses:
 *       200:
 *         description: An array of pois
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
 *               example: Retrieved pois
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/definitions/Poi'
 */
router.get('/findByLabel', poiController.getPoisByQuery);


/**
 * @swagger
 * /api/pois:
 *   get:
 *     tags:
 *       - Pois
 *     description: Returns POIs in this Area (16 max)
 *     summary: Returns POIs in this Area (16 max)
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: north
 *         required: true
 *         in: query
 *         type: number
 *         description: Poi's bound north (example 48.721093728486146)
 *         default: 48.721093728486146
 *       - name: south
 *         required: true
 *         in: query
 *         type: number
 *         description: Poi's bound south (example 48.62428582180533)
 *         default: 48.62428582180533
 *       - name: east
 *         required: true
 *         in: query
 *         type: number
 *         description: Poi's bound east (example 6.273365020751953)
 *         default: 6.273365020751953
 *       - name: west
 *         required: true
 *         in: query
 *         type: number
 *         description: Poi's bound west (example 6.099987030029298)
 *         default: 6.099987030029298
 *       - name: datetime
 *         in: query
 *         type: string
 *         description: Date time start (if empty = now() )
 *         format: date
 *       - name: type
 *         in: query
 *         type: integer
 *         description: type pois selected 1 == ACT, 2 == POI, 3 == PDT (if empty = ALL )
 *     responses:
 *       200:
 *         description: An array of pois
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
 *               example: Retrieved pois
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/definitions/Poi'
 */
router.get('/', poiController.getPois);




/**
 * @swagger
 * /api/pois/{id}:
 *   get:
 *     tags:
 *       - Pois
 *     description: Returns informations of a single POI
 *     summary: Returns informations of a single POI
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id
 *         description: Poi's id
 *         in: path
 *         required: true
 *         type: integer
 *     responses:
 *       200:
 *         description: A single poi
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
 *               example: Retrieved pois
 *             data:
 *               type: object
 *               $ref: '#/definitions/Poi'
 */
router.get('/:id', poiController.getPoiDetails);


/**
 * @swagger
 * /api/pois:
 *   post:
 *     tags:
 *       - Pois
 *     description: Creates a new poi
 *     produces:
 *       - application/json
 *     security:
 *       - authorisationJWT: []
 *     parameters:
 *       - name: poi
 *         description: Fields for the new Poi resource
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/CreatePoi'
 *     responses:
 *       200:
 *         description: Successfully created
 */
router.post('/', poiController.createPoi);


/**
 * @swagger
 * /api/pois/{id}:
 *   put:
 *     tags:
 *       - Pois
 *     description: Updates a single poi
 *     produces:
 *       - application/json
 *     security:
 *       - authorisationJWT: []
 *     parameters:
 *       - name: id
 *         description: Poi's id
 *         in: path
 *         required: true
 *         type: integer
 *       - name: poi
 *         description: Fields for Poi resource
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Poi'
 *     responses:
 *       200:
 *         description: Successfully updated
 */
router.put('/:id', poiController.updatePoi);


// /**
//  * @swagger
//  * /api/pois/{id}:
//  *   delete:
//  *     tags:
//  *       - Pois
//  *     description: Deletes a single poi
//  *     produces:
//  *       - application/json
//  *     parameters:
//  *       - name: id
//  *         description: Poi's id
//  *         in: path
//  *         required: true
//  *         type: integer
//  *     responses:
//  *       200:
//  *         description: Successfully deleted
//  */
// router.delete('/:id', poiController.removePoi);


module.exports = router;