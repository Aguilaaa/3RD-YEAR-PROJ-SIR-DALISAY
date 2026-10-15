const mongoose = require('mongoose');

let connection;

/**
 * One shared Mongoose connection for this long-running Express process.
 * Pool size stays at the driver default: a single classroom server does not
 * need a custom pool, and an oversized pool would only hold idle connections.
 */
async function connectDB() {
  if (connection) return connection;

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mototech';
  mongoose.set('strictQuery', true);
  connection = await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 15000,
  });
  console.log('MongoDB connected');
  return connection;
}

module.exports = { connectDB };
