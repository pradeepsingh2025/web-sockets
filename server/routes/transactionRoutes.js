const express = require('express');
const { authenticateUser } = require('../middlewares/userAuth');
const {
    userValidation,
    transactionValidation,
    queryValidation
} = require("../middlewares/validation")

const router = express.Router()


function createTransaction(transactionController) {
  
  // Routes
  router.post('/deposit', authenticateUser, transactionValidation.deposit, transactionController.createDeposit);
  router.post('/withdrawal', authenticateUser, transactionValidation.withdrawal, transactionController.createWithdrawal);
  router.get('/mytransactions', authenticateUser, transactionController.getUserTransactions);
  router.get('/:orderId', authenticateUser, transactionController.getTransactionDetails);


  return router;
}


module.exports = createTransaction;