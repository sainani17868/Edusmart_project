/**
 * @module config/db
 * @description Mongoose database connection with retry logic and event listeners
 */

import mongoose from 'mongoose';
import { config } from './env.js';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

let retryCount = 0;

/**
 * Establish a connection to MongoDB using Mongoose.
 * Automatically retries up to MAX_RETRIES times on failure.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    retryCount = 0; // Reset on successful connection

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📦 Database: ${conn.connection.name}`);
  } catch (error) {
    retryCount += 1;
    console.error(`❌ MongoDB connection error (attempt ${retryCount}/${MAX_RETRIES}): ${error.message}`);

    if (retryCount < MAX_RETRIES) {
      console.log(`🔄 Retrying connection in ${RETRY_DELAY_MS / 1000} seconds...`);
      setTimeout(connectDB, RETRY_DELAY_MS);
    } else {
      console.error('💀 Max retry attempts reached. Exiting process.');
      process.exit(1);
    }
  }
};

// ─── Mongoose Connection Event Listeners ─────────────────────────────────────

mongoose.connection.on('connected', () => {
  console.log('🟢 Mongoose connection established.');
});

mongoose.connection.on('disconnected', () => {
  console.warn('🟡 Mongoose connection lost. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔵 Mongoose reconnected successfully.');
});

mongoose.connection.on('error', (err) => {
  console.error(`🔴 Mongoose connection error: ${err.message}`);
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────

/**
 * Close mongoose connection gracefully on process termination.
 * @param {string} signal - OS signal that triggered shutdown
 */
const gracefulShutdown = async (signal) => {
  try {
    await mongoose.connection.close();
    console.log(`🛑 Mongoose connection closed due to ${signal}`);
    process.exit(0);
  } catch (err) {
    console.error('Error during mongoose shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // nodemon restart

export default connectDB;
