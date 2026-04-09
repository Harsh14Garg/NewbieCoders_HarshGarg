const nodemailer = require('nodemailer');
const config = require('../config/config');

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.port === 465,
  auth: {
    user: config.email.user,
    pass: config.email.password,
  },
});

const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: config.email.from,
      to,
      subject,
      html,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent:', result.messageId);
    return result;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

const sendBookingConfirmation = async (user, booking, event) => {
  const html = `
    <h2>Booking Confirmation - ${event.title}</h2>
    <p>Dear ${user.name},</p>
    <p>Your booking has been confirmed!</p>
    <h3>Booking Details:</h3>
    <ul>
      <li>Event: ${event.title}</li>
      <li>Date: ${new Date(event.dateTime).toLocaleString()}</li>
      <li>Tickets: ${booking.numberOfTickets}</li>
      <li>Total Amount: $${booking.totalAmount}</li>
      <li>Booking Reference: ${booking._id}</li>
    </ul>
    <p>Check your account for QR codes and more details.</p>
    <p>Thank you for using SpotOn!</p>
  `;

  return sendEmail(user.email, `Booking Confirmation - ${event.title}`, html);
};

const sendCancellationEmail = async (user, event) => {
  const html = `
    <h2>Booking Cancelled - ${event.title}</h2>
    <p>Dear ${user.name},</p>
    <p>Your booking for the following event has been cancelled:</p>
    <h3>Event Details:</h3>
    <ul>
      <li>Event: ${event.title}</li>
      <li>Date: ${new Date(event.dateTime).toLocaleString()}</li>
    </ul>
    <p>If you did not request this cancellation, please contact us immediately.</p>
  `;

  return sendEmail(user.email, `Booking Cancelled - ${event.title}`, html);
};

module.exports = {
  sendEmail,
  sendBookingConfirmation,
  sendCancellationEmail,
};
