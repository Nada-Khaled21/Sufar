const { check } = require('express-validator');

const validateFullName = [
  check('fullName')
    .trim()
    .notEmpty().withMessage('FullName is required')
    .isLength({ min: 3, max: 15 }).withMessage('FullName must be between 3 and 15 characters')
    .customSanitizer(value => {
      if (typeof value !== 'string' || value.length === 0) return value;
      return value.charAt(0).toUpperCase() + value.slice(1);
    })
];

const validateEmail = [
  check('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail()
];

const validatePassword = [
  check('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be more than 8 characters')
    .custom(value => {
      const symbol = /[!@#$%^&*]/;
      if (!symbol.test(value)) {
        throw new Error('Password must include at least one symbol (!@#$%^&*)');
      }
      return true;
    }),
];


module.exports = { validateFullName, validateEmail, validatePassword };