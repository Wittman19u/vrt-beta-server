const nodemailer = require('nodemailer');

const transporter =  nodemailer.createTransport({
	host: process.env.SMTP_HOST,
	port: process.env.SMTP_PORT,
	//secure: process.env.SMTP_SECURE, // use SSL
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASSWORD
	}
});

module.exports = transporter;