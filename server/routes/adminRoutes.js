const express = require("express");
const { body } = require("express-validator");
const AdminController = require("../controllers/AdminController");
const { authenticateAdmin, requirePermission } = require("../middlewares/adminAuth");

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

// Routes
router.get(
  "/transactions/pending",
  authenticateAdmin,
  requirePermission("VIEW_TRANSACTIONS"),
  AdminController.getPendingTransactions
);
router.put(
  "/transactions/:transactionId/approve",
  authenticateAdmin,
  requirePermission("APPROVE_DEPOSITS"),
  approveValidation,
  AdminController.approveTransaction
);
router.put(
  "/transactions/:transactionId/complete",
  authenticateAdmin,
  requirePermission("APPROVE_DEPOSITS"),
  completeValidation,
  AdminController.completeTransaction
);
router.put(
  "/transactions/:transactionId/reject",
  authenticateAdmin,
  requirePermission("APPROVE_DEPOSITS"),
  rejectValidation,
  AdminController.rejectTransaction
);
router.get(
  "/transactions/stats",
  authenticateAdmin,
  requirePermission("VIEW_REPORTS"),
  AdminController.getTransactionStats
);

module.exports = router;
