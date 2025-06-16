const GameController = require('./GameController');
const UserController = require('./UserController');
const WebSocketController = require('./WebSocketController');
const { createUser } = require('./UserInfoController')

module.exports = {
  GameController,
  UserController,
  createUser,
  WebSocketController
};
