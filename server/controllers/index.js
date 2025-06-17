const GameController = require('./GameController');
const UserController = require('./UserController');
const UserInfoController = require("./UserInfoController")
const WebSocketController = require('./WebSocketController');
const WalletController = require("./WalletController");
const AdminController = require("./AdminController")
const TransactionController = require("./TransactionController")

module.exports = {
  GameController,
  UserController,
  UserInfoController,
  WalletController,
  WebSocketController,
  AdminController,
  TransactionController
};
