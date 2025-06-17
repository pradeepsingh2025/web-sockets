const express = require('express');
const { body } = require('express-validator');
const { authenticateUser } = require('../middlewares/userAuth');

const router = express.Router()

// Validation rules
const depositValidation = [
  body('amount').isNumeric().isFloat({ min: 10 }).withMessage('Amount must be at least 10'),
  body('utrNumber').notEmpty().isLength({ min: 12, max: 12 }).withMessage('UTR number must be 12 characters')
];

const withdrawalValidation = [
  body('amount').isNumeric().isFloat({ min: 10 }).withMessage('Amount must be at least 10'),
  body('upiId').matches(/^[\w.-]+@[\w.-]+$/).withMessage('Invalid UPI ID format')
];


function createTransaction(transactionController) {
  
  // Routes
  router.post('/deposit', authenticateUser, depositValidation, transactionController.createDeposit);
  router.post('/withdrawal', authenticateUser, withdrawalValidation, transactionController.createWithdrawal);
  router.get('/my-transactions', authenticateUser, transactionController.getUserTransactions);
  router.get('/:orderId', authenticateUser, transactionController.getTransactionDetails);


  return router;
}


module.exports = createTransaction;