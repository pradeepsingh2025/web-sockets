const jwt = require("jsonwebtoken");

const config = require("../config/config");
const JWT_SECRET = config.JWT_SECRET;
const ADMIN_JWT_SECRET = config.ADMIN_JWT_SECRET

const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "1d" });
};

const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

const generateTokenForAdmin = (payload) =>{
  return jwt.sign(payload, ADMIN_JWT_SECRET, {expiresIn: '1d'})
}
const verifyTokenForAdmin = (admin_token)=>{
  return jwt.verify(admin_token, ADMIN_JWT_SECRET)
}

module.exports = {
  generateToken,
  verifyToken,
  generateTokenForAdmin,
  verifyTokenForAdmin,
  JWT_SECRET,
  ADMIN_JWT_SECRET
};
