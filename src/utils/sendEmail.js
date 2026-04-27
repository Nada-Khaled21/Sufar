const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, htmlContent) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, 
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, 
      },
    });

    const info = await transporter.sendMail({
      from: `"Sufar Travel" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: htmlContent,
    });

    console.log(" Actual Email Sent! ID:", info.messageId);
    return true;
  } catch (error) {
    // السطر ده هو اللي هيعرفنا جوجل زعلانة ليه
    console.error(" REAL MAIL ERROR:", error.message);
    return false;
  }
};

module.exports = sendEmail;