const express = require("express");
const { body } = require("express-validator");
const AdminController = require("../controllers/AdminController");
const {
  authenticateAdmin,
  requirePermission,
} = require("../middlewares/adminAuth");

const router = express.Router();

// Validation rules
const approveValidation = [
  body("remarks")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Remarks cannot exceed 500 characters"),
];

const rejectValidation = [
  body("reason")
    .notEmpty()
    .isLength({ min: 10, max: 500 })
    .withMessage("Reason must be between 10-500 characters"),
];

const completeValidation = [
  body("paymentDetails").optional().isObject(),
  body("paymentDetails.transactionId").optional().notEmpty(),
  body("paymentDetails.gateway").optional().notEmpty(),
];

function createAdminRoutes(adminController) {
  // Routes

  router.post("/signup", adminController.createAdmin);
  router.post("/login", adminController.getAdmin);

  router.get(
    "/alltransactions",
    authenticateAdmin,
    requirePermission("VIEW_TRANSACTIONS"),
    adminController.getAllTransactions
  );

  router.get(
    "/transactions/pending",
    authenticateAdmin,
    requirePermission("VIEW_TRANSACTIONS"),
    adminController.getPendingTransactions
  );
  router.put(
    "/transactions/:transactionId/approve",
    authenticateAdmin,
    requirePermission("APPROVE_DEPOSITS"),
    approveValidation,
    adminController.approveTransaction
  );
  router.put(
    "/transactions/:transactionId/complete",
    authenticateAdmin,
    requirePermission("APPROVE_DEPOSITS"),
    completeValidation,
    adminController.completeTransaction
  );
  router.put(
    "/transactions/:transactionId/reject",
    authenticateAdmin,
    requirePermission("APPROVE_DEPOSITS"),
    rejectValidation,
    adminController.rejectTransaction
  );
  router.get(
    "/transactions/stats",
    authenticateAdmin,
    requirePermission("VIEW_REPORTS"),
    adminController.getTransactionStats
  );

  return router;
}

module.exports = createAdminRoutes;
