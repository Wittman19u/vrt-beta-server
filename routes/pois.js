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
 *         description: Poi's bound north
 *         in: query
 *         type: number
 *         example: 48.277773
 *       - name: south
 *         description: Poi's bound south
 *         in: query
 *         type: number
 *         example: 48.172479
 *       - name: east
 *         description: Poi's bound east
 *         in: query
 *         type: number
 *         example: 6.447543
 *       - name: west
 *         description: Poi's bound west
 *         in: query
 *         type: number
 *         example: 6.569276
 *       - name: datetime
 *         description: Date time start
 *         in: query
 *         type: string
 *         format: datetime
 *       - name: type
 *         description: type pois selected 1 == ACT 2 == POI 3 == PDT
 *         in: query
 *         type: integer
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
router.get('/', poiController.getInBoundPois);


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
router.get('/:id', poiController.getSinglePoi);


// /**
//  * @swagger
//  * /api/pois:
//  *   post:
//  *     tags:
//  *       - Pois
//  *     description: Creates a new poi
//  *     produces:
//  *       - application/json
//  *     parameters:
//  *       - name: poi
//  *         description: Fields for the new Poi resource
//  *         in: body
//  *         required: true
//  *         schema:
//  *           $ref: '#/definitions/Poi'
//  *     responses:
//  *       200:
//  *         description: Successfully created
//  */
// router.post('/', poiController.createPoi);


// /**
//  * @swagger
//  * /api/pois/{id}:
//  *   put:
//  *     tags:
//  *       - Pois
//  *     description: Updates a single poi
//  *     produces:
//  *       - application/json
//  *     parameters:
//  *       - name: id
//  *         description: Poi's id
//  *         in: path
//  *         required: true
//  *         type: integer
//  *       - name: poi
//  *         description: Fields for Poi resource
//  *         in: body
//  *         required: true
//  *         schema:
//  *           $ref: '#/definitions/Poi'
//  *     responses:
//  *       200:
//  *         description: Successfully updated
//  */
// router.put('/:id', poiController.updatePoi);


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