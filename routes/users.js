var express = require('express');
var userController = require('../controllers/users');
var router = express.Router();

/**
 * @swagger
 * definitions:
 *   User:
 *     properties:
 *       id:
 *         type: integer
 *       firstname:
 *         type: string
 *       lastname:
 *         type: string
 *       dateborn:
 *         type: string
 *         format: date
 *       gender:
 *         type: integer
 *         default: 1
 *         description: 1==man, 2==woman, 3 not defined
 *       biography:
 *         type: string
 *       email:
 *         type: string
 *         format: email
 *       phone:
 *         type: string
 *       password:
 *         type: string
 *         format: password
 *       localtoken:
 *         type: string
 *       expireslocaltoken:
 *         type: string
 *         format: date
 *       language:
 *         type: string
 *       facebookid:
 *         type: string
 *       facebooktoken:
 *         type: string
 *       facebookname:
 *         type: string
 *       facebookemail:
 *         type: string
 *         format: email
 *       role_id:
 *         type: integer
 *         description: 1==man, 2==woman, 3 not defined
 *       status_id:
 *         type: integer
 *       media_id:
 *         type: integer
 *       consent:
 *         type: boolean
 *       consentthird:
 *         type: boolean
 *       created_at:
 *         type: string
 *         format: date-time
 *       updated_at:
 *         type: string
 *         format: date-time
 *       consent_at:
 *         type: integer
 *         format: date-time
 *     required:
 *       - email
 *       - password
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     tags:
 *       - Users
 *     description: Returns all users
 *     summary: Returns a users list (max 16)
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: limit
 *         description: User's limit number
 *         in: query
 *         type: integer
 *         default: 10
 *         minimum: 1
 *         maximum: 16
 *     responses:
 *       200:
 *         description: An array of users
 *         schema:
 *           $ref: '#/definitions/User'
 */
router.get('/', userController.getAllUsers);


/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     tags:
 *       - Users
 *     description: Returns a single user
 *     summary: Returns a single user
 *     security:
 *       - bearerAuth: []
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id
 *         description: user's id
 *         in: path
 *         required: true
 *         type: integer
 *     responses:
 *       200:
 *         description: A single user
 *         schema:
 *           $ref: '#/definitions/User'
 */
router.get('/:id', userController.getSingleUser);


/**
 * @swagger
 * /api/users:
 *   post:
 *     tags:
 *       - Users
 *     description: Creates a new user
 *     summary: Creates a new user
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: user
 *         description: Fields for the new User resource
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/User'
 *     responses:
 *       200:
 *         description: Successfully created
 *       403:
 *         description: Username or email already taken
 */
router.post('/', userController.createUser);


/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     tags:
 *       - Users
 *     description: Updates a single user
 *     summary: Updates a single user
 *     security:
 *       - bearerAuth: []
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id
 *         description: user's id
 *         in: path
 *         required: true
 *         type: integer
 *       - name: user
 *         description: Fields for User resource
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/User'
 *     responses:
 *       200:
 *         description: Successfully updated
 */
router.put('/:id', userController.updateUser);


/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     tags:
 *       - Users
 *     description: Deletes a single user
 *     summary: Deletes a single user
 *     security:
 *       - bearerAuth: []
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id
 *         description: User's id
 *         in: path
 *         required: true
 *         type: integer
 *     responses:
 *       200:
 *         description: Successfully deleted
 */
router.delete('/:id', userController.removeUser);

/**
 * @swagger
 * /api/users/loginUser:
 *   post:
 *     tags:
 *       - Users
 *     name: Login
 *     summary: Logs in a user
 *     produces:
 *       - application/json
 *     consumes:
 *       - application/json
 *     parameters:
 *       - name: body
 *         in: body
 *         schema:
 *           $ref: '#/definitions/User'
 *           type: object
 *           properties:
 *             email:
 *               type: string
 *               format: email
 *             password:
 *               type: string
 *               format: password
 *         required:
 *           - email
 *           - password
 *     responses:
 *       '200':
 *         description: User found and logged in successfully
 *       '401':
 *         description: Email not found in db
 *       '403':
 *         description: Email and password don't match
 */
router.post('/loginUser', userController.loginUser);

/**
 * @swagger
 * /api/users/forgotPassword:
 *   post:
 *     tags:
 *       - Users
 *     name: Forgot Password
 *     summary: Sends an email with a reset password link when a user inevitably forgets their password
 *     consumes:
 *       - application/json
 *     parameters:
 *      - name: body
 *        in: body
 *        schema:
 *          $ref: '#/definitions/User'
 *          type: object
 *          properties:
 *            email:
 *              type: string
 *              format: email
 *        required:
 *          - email
 *     responses:
 *       '200':
 *         description: Reset email sent
 *       '400':
 *         description: Email required
 *       '403':
 *         description: Email not found in db
 */
router.post('/forgotPassword', userController.forgotPassword);

/**
 * @swagger
 * /api/users/updatePasswordViaEmail:
 *   put:
 *     tags:
 *       - Users
 *     name: Update user's password
 *     summary: Update user's password after they've forgotten it
 *     consumes:
 *       - application/json
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: body
 *         schema:
 *           $ref: '#/definitions/User'
 *           type: object
 *           properties:
 *             email:
 *               type: string
 *               format: email
 *             password:
 *               type: string
 *               format: password
 *             resetPasswordToken:
 *               type: string
 *         required:
 *           - email
 *           - password
 *           - resetPasswordToken
 *     responses:
 *       '200':
 *         description: User's password successfully updated
 *       '401':
 *         description: No user found in the database to update
 *       '403':
 *         description: Password reset link is invalid or has expired
 */
router.put('/updatePasswordViaEmail', userController.updatePasswordViaEmail);

/**
 * @swagger
 * /api/users/updatePassword:
 *   put:
 *     tags:
 *       - Users
 *     name: Update password logged in
 *     summary: Update password while user is already logged in
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - application/json
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: body
 *         in: body
 *         schema:
 *           $ref: '#/definitions/User'
 *           type: object
 *           properties:
 *             email:
 *               type: string
 *               format: email
 *             password:
 *               type: string
 *               format: password
 *         required:
 *           - email
 *           - password
 *     responses:
 *       '200':
 *         description: User's password successfully updated
 *       '403':
 *         description: User is not authorized to change their password
 *       '404':
 *         description: User is not found in db to update
 *
 */
router.put('/updatePassword', userController.updatePassword);


module.exports = router;