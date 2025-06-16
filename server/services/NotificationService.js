class NotificationService {
  static async notifyAdminNewDeposit(transaction) {
    // Implementation for admin notification (email, SMS, push notification)
    console.log(`New deposit request: ${transaction.orderId} for amount ${transaction.amount}`);
  }

  static async notifyAdminNewWithdrawal(transaction) {
    // Implementation for admin notification
    console.log(`New withdrawal request: ${transaction.orderId} for amount ${transaction.amount}`);
  }

  static async notifyUserTransactionApproved(transaction) {
    // Implementation for user notification
    console.log(`Transaction approved: ${transaction.orderId}`);
  }

  static async notifyUserTransactionCompleted(transaction) {
    // Implementation for user notification
    console.log(`Transaction completed: ${transaction.orderId}`);
  }

  static async notifyUserTransactionRejected(transaction, reason) {
    // Implementation for user notification
    console.log(`Transaction rejected: ${transaction.orderId} - ${reason}`);
  }
}

module.exports = NotificationService;