const nodemailer = require('nodemailer');

const transporter =  nodemailer.createTransport({
    host: "smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "f012a56ec592d3", //generated by Mailtrap
      pass: "67b643c8eba673" //generated by Mailtrap
    }
  });

module.exports = transporter;