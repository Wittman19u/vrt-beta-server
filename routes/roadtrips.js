var express = require('express');
var roadtripController = require('../controllers/roadtrips');
var router = express.Router();

/**
 * @swagger
 * definitions:
 *   Roadtrip:
 *     type: object
 *     properties:
 *       id:
 *         type: integer
 *       title:
 *         type: string
 *       departure:
 *         type: string
 *       arrival:
 *         type: string
 *       start:
 *         type: timestamp
 *       end:
 *         type: timestamp
 *       distance:
 *         type: numeric(7,2)
 *       duration:
 *         type: bigint
 *       hashtag:
 *         type: jsonb
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
 *       - title
 *       - departure
 *       - arrival
 *       - start
 *       - end
 */

/**
 * @swagger
 * /api/roadtrips:
 *   post:
 *     tags:
 *       - Roadtrips
 *     description: Creates a new roadtrip
 *     produces:
 *       - application/json
 *     security:
 *       - authorisationJWT: []x
 *     parameters:
 *       - name: body
 *         in: body
 *         description: data to send
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Roadtrip'
 *     responses:
 *       200:
 *         description: Successfully created
 */
router.post('/', roadtripController.createRoadtrip);

module.exports = router;