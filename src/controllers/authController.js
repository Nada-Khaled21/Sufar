const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');

// توليد كود عشوائي
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// =====================
// Register
// =====================
exports.register = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const code = generateCode();

    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      verifyCode: code,
      verifyCodeExpire: Date.now() + 10 * 60 * 1000
    });

    await sendEmail(
      email,
      'Verify your Sufar account',
      `<h2>Your verification code is: <strong>${code}</strong></h2>
       <p>This code will expire in 10 minutes.</p>`
    );

    res.status(201).json({ message: 'Account created! Please verify your email.' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =====================
// Verify Code
// =====================
exports.verifyCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.verifyCode !== code) {
      return res.status(400).json({ message: 'Invalid code' });
    }

    if (user.verifyCodeExpire < Date.now()) {
      return res.status(400).json({ message: 'Code expired' });
    }

    user.isVerified = true;
    user.verifyCode = undefined;
    user.verifyCodeExpire = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully!' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =====================
// Login
// =====================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    if (!user.isVerified) {
      return res.status(400).json({ message: 'Please verify your email first' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =====================
// Forgot Password
// =====================

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Email not found' });
        }

        const resetCode = generateCode();
        user.resetPasswordCode = resetCode;
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
        await user.save();

        console.log("Attempting to send email to:", user.email);

        const emailWasSent = await sendEmail(
            user.email,
            "Sufar Travel - Password Reset Request",
            `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                <h2 style="color: #2c3e50; text-align: center;">Password Reset</h2>
                <p style="font-size: 16px; color: #333;">Hello ${user.fullName},</p>
                <p style="font-size: 16px; color: #333;">We received a request to reset your password for your Sufar Travel account. Your reset code is:</p>
                <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #e74c3c; border-radius: 5px; margin: 20px 0;">
                    ${resetCode}
                </div>
                <p style="font-size: 14px; color: #7f8c8d;">If you did not request this, please ignore this email. The code will expire in 10 minutes.</p>
                <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
                <p style="font-size: 12px; color: #95a5a6; text-align: center;">© 2026 Sufar Travel. All rights reserved.</p>
            </div>
            `
        );

        if (emailWasSent) {
            console.log(" Controler: Email sent successfully");
            return res.status(200).json({ message: "Email sent!" });
        } else {
            console.log(" Controler: Email failed to send");
            return res.status(500).json({ message: "Email failed" });
        }

    } catch (error) {
        console.error("Main Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};
// =====================
// Reset Password
// =====================
exports.resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword, password } = req.body;
    const resolvedPassword = newPassword || password;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.resetPasswordCode !== code) {
      return res.status(400).json({ message: 'Invalid code' });
    }

    if (user.resetPasswordExpire < Date.now()) {
      return res.status(400).json({ message: 'Code expired' });
    }

    if (!resolvedPassword) {
      return res.status(400).json({ message: 'New password is required' });
    }

    user.password = await bcrypt.hash(resolvedPassword, 10);
    user.resetPasswordCode = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully!' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =====================
// Log Out
// =====================
const Logout = async (req, res) => {
  try {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "Strict"
    });

    res.json({ message: "Logout successful" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};