const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, htmlContent) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // Port 465 uses secure: true
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      // إضافة المهلة عشان Vercel يستنى شوية
      connectionTimeout: 10000, 
      greetingTimeout: 10000,
    });

    const info = await transporter.sendMail({
      from: `"Sufar Travel" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: htmlContent
    });

    console.log(`✅ Success! Email ID: ${info.messageId}`);
    return true;

  } catch (error) {
    console.error(`❌ Email Error: ${error.message}`);
    throw error;
  }
};

module.exports = sendEmail;