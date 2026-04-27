const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, htmlContent) => {
  // السطرين دول عشان نتأكد إن Vercel شايف المتغيرات فعلاً
  console.log("Checking Config...");
  console.log("Email User:", process.env.EMAIL_USER ? "✅ Found" : "❌ NOT FOUND");
  console.log("Email Pass:", process.env.EMAIL_PASS ? "✅ Found" : "❌ NOT FOUND");

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
            }
    });

    const info = await transporter.sendMail({
      from: `"Sufar Travel" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: htmlContent,
    });

    console.log("Actual Email Sent! ID:", info.messageId);
    return true;
  } catch (error) {
    console.error("REAL MAIL ERROR:", error.message);
    return false;
  }
};

module.exports = sendEmail;