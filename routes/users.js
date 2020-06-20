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
 *       language:
 *         type: string
 *       media_id:
 *         type: integer
 *       status_id:
 *         type: integer
 *       role_id:
 *         type: integer
 *       codetemp:
 *         type: integer
 *       expirescodetemp:
 *         type: string
 *         format: date
 *       localtoken:
 *         type: string
 *       expireslocaltoken:
 *         type: string
 *         format: date
 *       googleid:
 *         type: string
 *       googletoken:
 *         type: string
 *       facebookid:
 *         type: string
 *       facebooktoken:
 *         type: string
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
 *       - firstname
 *       - email
 *       - gender
 *       - created_at
 *       - updated_at
 *       - consent_at
 * 
 *   Media:
 *     properties:
 *       id:
 *         type: integer
 *       title:
 *         type: string
 *       descript:
 *         type: string
 *       link:
 *         type: string
 *       filename:
 *         type: string
 *       filepath:
 *         type: string
 *       filesize:
 *         type: integer
 *       type:
 *         type: string
 *       status_id:
 *         type: integer
 *       account_id:
 *         type: integer
 *       created_at:
 *         type: string
 *         format: date-time
 *       updated_at:
 *         type: string
 *         format: date-time
 * 
 *   UserWithMedia:
 *     allOf:
 *       - $ref: '#/definitions/User'
 *       - $ref: '#/definitions/Media'
 */


/**
 * @swagger
 * definitions:
 *   UserCreate:
 *     properties:
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
 *       language:
 *         type: string
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
 *         type: string
 *         format: date-time
 *     required:
 *       - firstname
 *       - email
 *       - password
 *       - gender
 *       - language
 *       - created_at
 *       - updated_at
 *       - consent_at
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     tags:
 *       - Users
 *     security:
 *       - authorisationJWT: []
 *     description: Returns a user based on email query
 *     summary: Returns a user
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: email
 *         description: Email we're looking for
 *         in: query
 *         type: string
 *         required: true
 *       - name: limit
 *         description: User's limit number
 *         in: query
 *         type: integer
 *         default: 10
 *         minimum: 1
 *         maximum: 16
 *     responses:
 *       200:
 *         description: id of the user if found, false if not
 *       403:
 *         description: Authenticated error
 *       500:
 *         description: Error during Select in DB
 */
router.get('/', userController.getUsersByQuery);


/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     tags:
 *       - Users
 *     description: Returns a single user and its media
 *     summary: Returns a single user and its media
 *     security:
 *       - authorisationJWT: []
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
 *         description: A single user and its media
 *         schema:
 *           type: object
 *           properties:
 *             user:
 *               $ref: '#/definitions/User'
 *             media:
 *               $ref: '#/definitions/Media'
 *       403:
 *         description: Authenticated error
 *       500:
 *         description: error fetching media
 */
router.get('/:id', userController.getUserDetails);


/**
 * @swagger
 * /api/users:
 *   post:
 *     tags:
 *       - Users
 *     description: Creates a new user
 *     summary: Creates a new user
 *     security:
 *       - authorisationJWT: []
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: user
 *         description: Fields for the new User resource
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/UserCreate'
 *     responses:
 *       200:
 *         description: Successfully created
 *       409:
 *         description: Username or email already taken
 *       401:
 *         description: Authenticate error
 */
router.post('/', userController.createUser);





/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     tags:
 *       - Users
 *     description: Deletes a single user
 *     summary: Deletes a single user
 *     security:
 *       - authorisationJWT: []
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
 *       401:
 *         description: Authenticate error
 *       404:
 *         description: No user with that username/email to delete
 *       500:
 *         description: Problem communicating with DB
 */
router.delete('/:id', userController.removeUser);

/**
 * @swagger
 * /api/users/loginuser:
 *   post:
 *     tags:
 *       - Users
 *     summary: Logs in a user
 *     consumes:
 *       - application/x-www-form-urlencoded
 *     parameters:
 *       - name: email
 *         type: string
 *         format: email
 *         in: formData
 *         required: true
 *       - name: password
 *         type: string
 *         format: password
 *         in: formData
 *         required: true
 *     responses:
 *       200:
 *         description: User found and logged in successfully
 *       403:
 *         description: Authenticate error
 *       401:
 *         description: Bad username / email
 *       500:
 *         description: Problem communicating with DB
 */
router.post('/loginuser', userController.loginUser);

/**
 * @swagger
 * /api/users/checkuser:
 *   get:
 *     tags:
 *       - Users
 *     summary: Checks if a user is registered
 *     consumes:
 *       - application/x-www-form-urlencoded
 *     parameters:
 *       - name: email
 *         description: Email we're looking for
 *         format: email
 *         in: query
 *         type: string
 *         required: true
 *     responses:
 *       200:
 *         description: User is in the database
 *       403:
 *         description: User is not in the database
 *       401:
 *         description: Bad email
 *       500:
 *         description: Problem communicating with DB
 */
router.get('/checkuser', userController.checkUser);

/**
 * @swagger
 * /api/users/forgotpassword:
 *   post:
 *     tags:
 *       - Users
 *     summary: Sends an email with a reset password link when a user inevitably forgets their password
 *     produces:
 *       - application/json
 *     consumes:
 *       - application/x-www-form-urlencoded
 *     parameters:
 *       - name: email
 *         type: string
 *         format: email
 *         in: formData
 *         required: true
 *     responses:
 *       200:
 *         description: Reset email sent
 *       400:
 *         description: Email required
 *       403:
 *         description: Email not found in db
 *       500:
 *         description: There was an error sending email or Problem during update DB
 */
router.post('/forgotpassword', userController.forgotPassword);

/**
 * @swagger
 * /api/users/forgotpasswordinapp:
 *   post:
 *     tags:
 *       - Users
 *     summary: Sends an email with a reset password code when a user inevitably forgets their password
 *     produces:
 *       - application/json
 *     consumes:
 *       - application/x-www-form-urlencoded
 *     parameters:
 *       - name: email
 *         type: string
 *         format: email
 *         in: formData
 *         required: true
 *     responses:
 *       200:
 *         description: Reset email sent
 *       400:
 *         description: Email required
 *       403:
 *         description: Email not found in db
 *       500:
 *         description: There was an error sending email or Problem during update DB
 */
router.post('/forgotpasswordinapp', userController.forgotPasswordInApp);

/**
 * @swagger
 * /api/users/checkresetcode:
 *   put:
 *     tags:
 *       - Users
 *     summary: Checks if the code the user is sending is valid
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: body
 *         in: body
 *         description: data to send {email, resetPasswordCode}
 *         schema:
 *           type: object
 *           required:
 *             - email
 *             - resetPasswordCode
 *           properties:
 *             email:
 *               type: string
 *               format: email
 *             resetPasswordCode:
 *               type: integer
 *     responses:
 *       200:
 *         description: The code is correct
 *       400:
 *         description: Field required.
 *       403:
 *         description: No user exists in db or password reset is invalid or has expired.
 *       500:
 *         description: Problem during update DB or Problem during password hash
 */
router.post('/checkresetcode', userController.checkResetCode);

/**
 * @swagger
 * /api/users/updatepasswordviaapp:
 *   put:
 *     tags:
 *       - Users
 *     summary: Update user's password after they've forgotten it
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: body
 *         in: body
 *         description: data to send {email, resetPasswordCode, password}
 *         schema:
 *           type: object
 *           required:
 *             - email
 *             - resetPasswordCode
 *             - password
 *           properties:
 *             email:
 *               type: string
 *               format: email
 *             resetPasswordCode:
 *               type: integer
 *             password:
 *               type: string
 *               format: password
 *     responses:
 *       200:
 *         description: User's password successfully updated.
 *       400:
 *         description: Field required.
 *       403:
 *         description: No user exists in db or password reset code is invalid or has expired.
 *       500:
 *         description: Problem during update DB or Problem during password hash
 */
router.put('/updatepasswordviaapp', userController.updatePasswordViaApp);

/**
 * @swagger
 * /api/users/updatepasswordviaemail:
 *   put:
 *     tags:
 *       - Users
 *     summary: Update user's password after they've forgotten it
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: body
 *         in: body
 *         description: data to send {email, resetPasswordToken, password}
 *         schema:
 *           type: object
 *           required:
 *             - email
 *             - resetPasswordToken
 *             - password
 *           properties:
 *             email:
 *               type: string
 *               format: email
 *             resetPasswordToken:
 *               type: string
 *             password:
 *               type: string
 *               format: password
 *     responses:
 *       200:
 *         description: User's password successfully updated.
 *       400:
 *         description: Field required.
 *       403:
 *         description: No user exists in db or password reset link is invalid or has expired.
 *       500:
 *         description: Problem during update DB or Problem during password hash
 */
router.put('/updatepasswordviaemail', userController.updatePasswordViaEmail);

/**
 * @swagger
 * /api/users/updatepassword:
 *   put:
 *     tags:
 *       - Users
 *     summary: Update password while user is already logged in
 *     security:
 *       - authorisationJWT: []
 *     consumes:
 *       - application/json
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: body
 *         in: body
 *         description: data to send {email, password}
 *         schema:
 *           type: object
 *           required:
 *             - email
 *             - password
 *           properties:
 *             email:
 *               type: string
 *               format: email
 *             password:
 *               type: string
 *               format: password
 *     responses:
 *       200:
 *         description: User's password successfully updated
 *       401:
 *         description: Authentication error.
 *       403:
 *         description: No user exists in db to update.
 *       500:
 *         description: Problem during update DB or Problem during password hash
 *
 */
router.put('/updatepassword', userController.updatePassword);


/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     tags:
 *       - Users
 *     description: Updates a single user
 *     summary: Updates a single user
 *     security:
 *       - authorisationJWT: []
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
 *       401:
 *         description: Authentication error.
 *       500:
 *         description: Problem during update DB
 */
router.put('/:id', userController.updateUser);

module.exports = router;