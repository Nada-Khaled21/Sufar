const express = require('express');
const router = express.Router();
const { validationResult } = require('express-validator');
const {
  register, verifyCode, login,
  forgotPassword, resetPassword, adminLogin
} = require('../controllers/authController');
const {
  validateEmail,
  validatePassword
} = require('../middleware/validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.post('/register',
  [...validateEmail, ...validatePassword],
  validate,
  register
);

router.post('/verify', verifyCode);

router.post('/login',
  [...validateEmail, ...validatePassword],
  validate,
  login
);
router.post('/forgot-password', validateEmail, validate, forgotPassword);

router.post('/reset-password', resetPassword);


router.get('/', (req, res) => {
  res.json({ message: "auth route working ✅" });
});

// Admin Login — بـ username مش email
router.post('/admin/login', adminLogin);

module.exports = router;