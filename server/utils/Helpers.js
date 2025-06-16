const successResponse = (res, message, data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

const errorResponse = (res, message, statusCode = 500, errors = []) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
    timestamp: new Date().toISOString(),
  });
};

const generateOrderId = (type) => {
  const prefix = type === "DEPOSIT" ? "DEP" : "WTH";
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

const generateUserId = () => {
  const prefix = "USR";
  const timestamp = Date.now().toString().slice(-6); // shorter timestamp
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

module.exports = {
  successResponse,
  errorResponse,
  generateOrderId,
  generateUserId,
};
