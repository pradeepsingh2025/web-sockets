const express = require("express");
const router = express.Router();
const { authenticateUser } = require("../middlewares/userAuth");


function createUserBetRoutes(userController) {
  router.get(
    "/stats",
    authenticateUser,
    userController.getUserStats.bind(userController)
  );
  return router;
}

function createUserInfoRoutes(userInfoController) {
  router.post("/signup", userInfoController.createUser);
  router.post("/login", userInfoController.getUser);

  router.get("/profile", authenticateUser, userInfoController.getProfile);
  router.put("/profile", authenticateUser, userInfoController.updateProfile);

  return router;
}

function createWalletInfoRoutes(walletController) {
  router.get("/wallet/balance", authenticateUser, walletController.getWalletBalance);
  router.get("/wallet/history", authenticateUser, walletController.getHistory);

  return router;
}

module.exports = {
  createUserBetRoutes,
  createUserInfoRoutes,
  createWalletInfoRoutes,
};
