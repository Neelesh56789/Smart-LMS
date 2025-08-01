const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Email configuration error:', error);
    console.error('Please check your EMAIL_USERNAME and EMAIL_PASSWORD in .env file');
  } else {
    console.log('Email server is ready to send emails');
  }
});

module.exports = transporter;