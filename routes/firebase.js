var express = require('express');
var firebaseController = require('../controllers/firebase');
var router = express.Router();

/**
 * @swagger
 * /api/firebase:
 *   get:
 *     tags:
 *       - Firebase
 *     description: Runs firebase notification check
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/', firebaseController.sendMessageToUsersWithRoadtripStartingToday);

module.exports = router;