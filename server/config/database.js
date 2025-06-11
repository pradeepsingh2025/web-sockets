const mongoose = require('mongoose');

class Database {
  static async connect() {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('Database connection error:', error);
      process.exit(1);
    }
  }

  static async disconnect() {
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
}

module.exports = Database;