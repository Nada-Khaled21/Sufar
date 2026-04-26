const { check } = require('express-validator');

const validateFullName = [
  check('fullName')
    .notEmpty().withMessage('FullName is required')
    .matches(/^[a-zA-Z\s]+$/).withMessage('FullName must contain only letters and spaces')
    .isLength({ min: 3, max: 30 }).withMessage('FullName must be between 3 and 30 characters')
    .trim()
    .customSanitizer(value => {
      if (typeof value !== 'string' || value.length === 0) return value;
      return value.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
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