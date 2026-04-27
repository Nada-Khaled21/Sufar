const { check } = require('express-validator');

const validateFullName = [
  check('fullName')
    .notEmpty().withMessage('FullName is required')
    .matches(/^[a-zA-Z\u0600-\u06FF\s]+$/).withMessage('FullName must contain only letters and spaces (Arabic or English)')
    .isLength({ min: 3, max: 50 }).withMessage('FullName must be between 3 and 50 characters')
    .trim()
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
];


module.exports = { validateFullName, validateEmail, validatePassword };