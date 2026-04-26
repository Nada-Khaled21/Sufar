// const express = require('express');
// const router = express.Router();
// const {
//   register,
//   verifyCode,
//   login,
//   forgotPassword,
//   resetPassword
// } = require('../controllers/authController');

// router.post('/register', register);
// router.post('/verify', verifyCode);
// router.post('/login', login);
// router.post('/forgot-password', forgotPassword);
// router.post('/reset-password', resetPassword);

// module.exports = router;



const express = require('express');
const router = express.Router();
const { validationResult } = require('express-validator');
const {
  register, verifyCode, login,
  forgotPassword, resetPassword
} = require('../controllers/authController');
const {
  validateEmail,
  validatePassword,
  validateFullName
} = require('../middleware/validator');


const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};


router.post('/register',
  [...validateFullName, ...validateEmail, ...validatePassword],
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

router.post('/reset-password', validatePassword, validate, resetPassword);

module.exports = router;