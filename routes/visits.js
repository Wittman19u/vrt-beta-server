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
 *           type: object
 *           properties:
 *             visit:
 *               $ref: '#/definitions/Visit'
 *             poi:
 *               $ref: '#/definitions/Poi'
 */
router.get('/:id', visitController.getVisitDetails);

/**
 * @swagger
 * /api/visit/{id}:
 *   put:
 *     tags:
 *       - Visits
 *     description: Updates a single visit
 *     produces:
 *       - application/json
 *     security:
 *       - authorisationJWT: []
 *     parameters:
 *       - name: id
 *         description: Visit's id
 *         in: path
 *         required: true
 *         type: integer
 *       - name: visit
 *         description: Fields for Visit resource
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Visit'
 *     responses:
 *       200:
 *         description: Successfully updated
 *       403:
 *         description: The user does not have rights to update this visit
 *       500:
 *         description: DB/login error
 */
router.put('/:id', visitController.updateVisit);

/**
 * @swagger
 * /api/visits/{id}:
 *   delete:
 *     tags:
 *       - Visits
 *     description: Deletes a visit
 *     produces:
 *       - application/json
 *     security:
 *       - authorisationJWT: []
 *     parameters:
 *       - name: id
 *         description: Visit's id
 *         in: path
 *         required: true
 *         type: integer
 *     responses:
 *       200:
 *         description: Successfully deleted
 *       403:
 *         description: The user does not have rights to remove this visit
 *       500:
 *         description: DB/login error
 */
router.delete('/:id', visitController.removeVisit);

module.exports = router;