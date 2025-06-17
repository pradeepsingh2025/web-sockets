const express = require("express");
const router = express.Router();
const { authenticateUser } = require("../middlewares/userAuth");

function createUserRoutes(userController) {
  router.get(
    "/stats",
    authenticateUser,
    userController.getUserStats.bind(userController)
  );
  router.get(
    "/balance",
    authenticateUser,
    userController.getUserBalance.bind(userController)
  );

  return router;
}

module.exports = createUserRoutes;
