/**
 * @module middleware/errorHandler
 * @description Global Express error handler.
 * Normalizes errors into consistent JSON responses.
 * Includes stack traces in development, safe messages in production.
 */

import mongoose from 'mongoose';
import { config } from '../config/env.js';

// ─── Error Type Detectors ─────────────────────────────────────────────────────

/**
 * Handle Mongoose CastError (invalid ObjectId format).
 * @param {mongoose.Error.CastError} err
 * @returns {{ statusCode: number, message: string }}
 */
const handleCastError = (err) => ({
  statusCode: 400,
  message: `Invalid value for field '${err.path}': ${err.value}`,
});

/**
 * Handle Mongoose duplicate key error (code 11000).
 * @param {{ keyValue: Record<string, unknown> }} err
 * @returns {{ statusCode: number, message: string }}
 */
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue || {})[0] || 'field';
  const value = err.keyValue?.[field];
  return {
    statusCode: 409,
    message: `Duplicate value: '${value}' is already in use for '${field}'.`,
  };
};

/**
 * Handle Mongoose ValidationError (schema-level validation failures).
 * @param {mongoose.Error.ValidationError} err
 * @returns {{ statusCode: number, message: string, errors: Array }}
 */
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((e) => ({
    field: e.path,
    message: e.message,
  }));
  return {
    statusCode: 422,
    message: 'Validation failed. Please check the provided data.',
    errors,
  };
};

/**
 * Handle JSON Web Token errors.
 * @returns {{ statusCode: number, message: string }}
 */
const handleJWTError = () => ({
  statusCode: 401,
  message: 'Invalid authentication token. Please log in again.',
});

/**
 * Handle expired JSON Web Token.
 * @returns {{ statusCode: number, message: string }}
 */
const handleJWTExpiredError = () => ({
  statusCode: 401,
  message: 'Your session has expired. Please log in again.',
});

// ─── Global Error Handler ─────────────────────────────────────────────────────

/**
 * Express global error handler middleware (4-argument signature).
 * Must be registered AFTER all routes and other middleware.
 *
 * @type {import('express').ErrorRequestHandler}
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Default values
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'An unexpected error occurred.';
  let errors = null;

  // ── Identify and normalize specific error types ──────────────────────────

  if (err instanceof mongoose.Error.CastError) {
    const normalized = handleCastError(err);
    statusCode = normalized.statusCode;
    message = normalized.message;
  } else if (err.code === 11000) {
    const normalized = handleDuplicateKeyError(err);
    statusCode = normalized.statusCode;
    message = normalized.message;
  } else if (err instanceof mongoose.Error.ValidationError) {
    const normalized = handleValidationError(err);
    statusCode = normalized.statusCode;
    message = normalized.message;
    errors = normalized.errors;
  } else if (err.name === 'JsonWebTokenError') {
    const normalized = handleJWTError();
    statusCode = normalized.statusCode;
    message = normalized.message;
  } else if (err.name === 'TokenExpiredError') {
    const normalized = handleJWTExpiredError();
    statusCode = normalized.statusCode;
    message = normalized.message;
  } else if (err.name === 'SyntaxError' && err.status === 400) {
    // Malformed JSON body
    statusCode = 400;
    message = 'Invalid JSON in request body.';
  }

  // In production, never expose internal server error details
  if (config.NODE_ENV === 'production' && statusCode === 500) {
    message = 'An internal server error occurred. Please try again later.';
  }

  // ── Log the error ────────────────────────────────────────────────────────

  if (statusCode >= 500) {
    console.error(`🔴 [${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    console.error('Error:', err);
  } else if (config.NODE_ENV !== 'test') {
    console.warn(`🟡 [${new Date().toISOString()}] ${req.method} ${req.originalUrl} — ${statusCode}: ${message}`);
  }

  // ── Build response payload ───────────────────────────────────────────────

  const response = {
    success: false,
    message,
    ...(errors && { errors }),
    ...(config.NODE_ENV === 'development' && {
      stack: err.stack,
      error: err.toString(),
    }),
  };

  res.status(statusCode).json(response);
};

export default errorHandler;
