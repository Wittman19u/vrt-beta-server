var express = require('express');
var visitController = require('../controllers/visits');
var router = express.Router();

/**
 * @swagger
 * definitions:
 *   Visit:
 *     type: object
 *     properties:
 *       id:
 *         type: integer
 *       sequence:
 *         type: integer
 *       waypoint_id:
 *         type: integer
 *       poi_id:
 *         type: integer
 *       created_at:
 *         type: string
 *         format: date-time
 *       updated_at:
 *         type: string
 *         format: date-time
 *     required:
 *       - sequence
 *       - waypoint_id
 *       - poi_id
 * 
 *   VisitWithPoi:
 *     type: object
 *     properties:
 *       visit:
 *         $ref: '#/definitions/Visit'
 *       poi:
 *         $ref: '#/definitions/Poi'
 */

/**
 * @swagger
 * /api/visits:
 *   post:
 *     tags:
 *       - Visits
 *     description: Creates a new visit
 *     produces:
 *       - application/json
 *     security:
 *       - authorisationJWT: []
 *     parameters:
 *       - name: body
 *         in: body
 *         description: data to send
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Visit'
 *     responses:
 *       200:
 *         description: Successfully created
 *       403:
 *         description: Authentication error
 *       500:
 *         description: Could not update DB (wrong data or db error)
 */
router.post('/', visitController.createVisit);


/**
 * @swagger
 * /api/visits/{id}:
 *   get:
 *     tags:
 *       - Visits
 *     description: Returns a visit and its associated poi.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id
 *         description: The visit's id
 *         in: path
 *         required: true
 *         type: integer
 *     responses:
 *       200:
 *         description: A single visit and its poi.
 *         schema:
 *           $ref: '#/definitions/VisitWithPoi'
 */
router.get('/:id', visitController.getVisitDetails);

module.exports = router;