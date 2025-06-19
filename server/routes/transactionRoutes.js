const express = require("express");
const { authenticateUser } = require("../middlewares/userAuth");
const {authenticateAdmin} = require("../middlewares/adminAuth")
const {
  userValidation,
  transactionValidation,
  queryValidation,
} = require("../middlewares/validation");

const router = express.Router();

function createTransaction(transactionController) {
  // Routes
  router.post(
    "/deposit",
    authenticateUser,
    transactionValidation.deposit,
    transactionController.createDeposit
  );
  router.post(
    "/withdrawal",
    authenticateUser,
    transactionValidation.withdrawal,
    transactionController.createWithdrawal
  );
  router.get(
    "/mytransactions",
    authenticateUser,
    transactionController.getUserTransactions
  );

  return router;
}

function searchTransactionById(transactionController) {
  router.get(
    "/:orderId",
    authenticateAdmin,
    transactionController.getTransactionDetails
  );

  return router;
}

module.exports = {
  createTransaction,
  searchTransactionById,
};
