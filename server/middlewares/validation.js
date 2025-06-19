const { body, query } = require('express-validator');

const userValidation = {
  register: [
    body('phone').matches(/^[6-9]\d{9}$/).withMessage('Invalid phone number'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  
  updateProfile: [
    body('phone').optional().matches(/^[6-9]\d{9}$/),
    body('upiId').optional().matches(/^[\w.-]+@[\w.-]+$/)
  ]
};

const transactionValidation = {
  deposit: [
    body('amount').isFloat({ min: 100, max: 10000 }).withMessage('Amount must be between 100-10000'),
    body('utrNumber').isLength({ min: 12, max: 12 }).withMessage('UTR number must be 12 characters')
  ],
  
  withdrawal: [
    body('amount').isFloat({ min: 100, max: 3000 }).withMessage('Amount must be between 100-3000'),
  ],
  
  adminAction: [
    body('remarks').optional().isLength({ max: 500 }).withMessage('Remarks cannot exceed 500 characters')
  ]
};

const queryValidation = {
  pagination: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1-100')
  ],
  
  transactionFilter: [
    query('status').optional().isIn(['PENDING', 'PROCESSING', 'COMPLETED', 'REJECTED', 'CANCELLED']),
    query('type').optional().isIn(['DEPOSIT', 'WITHDRAWAL'])
  ]
};

module.exports = {
  userValidation,
  transactionValidation,
  queryValidation
};