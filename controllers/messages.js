const transporter = require('./email'); // pass nodemailer for configuration

function createMessage(req, res, next) {
	const mailOptions = {
		from: req.body.email,
		to: process.env.CONTACT_SAV,
		subject: req.body.subject,
		text: 'Hi, \n\n'
			+ `You are received this message from Mrs/Mr ${req.body.name}: \n\n`
			+ `${req.body.description}\n\n`
	};
	transporter.sendMail(mailOptions, (error, response) => {
		if (error) {
			console.error(`There was an error sending email: ${error}`);
			res.status(500).json({
				status: 'error',
				message: `There was an error sending email: ${error}`
			});
		}
		res.status(200).json({
			status: 'success',
			message:'Message email sent!'
		});
	});
}

module.exports = {
	createMessage: createMessage
};