// utils/sendEmail.js - REAL SMTP with Gmail
const nodemailer = require('nodemailer');

// Create transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendEmail = async (to, subject, htmlContent) => {
  try {
    // Verify connection configuration
    await transporter.verify();
    
    // Send mail with defined transport object
    const info = await transporter.sendMail({
      from: `"Sufar Travel" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: htmlContent
    });
    
    console.log(` Email sent successfully to ${to}`);
    console.log(` Message ID: ${info.messageId}`);
    
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error(` Failed to send email to ${to}:`, error.message);
    throw new Error(`Email sending failed: ${error.message}`);
  }
};

module.exports = sendEmail;