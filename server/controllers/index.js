const GameController = require('./GameController');
const UserController = require('./UserController');
const WebSocketController = require('./WebSocketController');
const { createUser, getUser } = require('./UserInfoController')

module.exports = {
  GameController,
  UserController,
  createUser,
  getUser,
  WebSocketController
};
