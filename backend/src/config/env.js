/**
 * @module config/env
 * @description Loads and validates all required environment variables.
 * Throws descriptive errors on startup if any required variable is missing.
 */

import dotenv from 'dotenv';

dotenv.config();

/**
 * Validate that required environment variables are present.
 * @param {string} key - The name of the env variable
 * @param {string} [defaultValue] - Optional default if variable is missing
 * @returns {string} The resolved environment variable value
 */
const requireEnv = (key, defaultValue = undefined) => {
  const value = process.env[key] ?? defaultValue;
  if (value === undefined || value === '') {
    throw new Error(
      `❌ Missing required environment variable: "${key}". ` +
        `Please check your .env file or environment configuration.`
    );
  }
  return value;
};

/**
 * Validated and exported environment configuration object.
 */
export const config = {
  /** Server port */
  PORT: parseInt(requireEnv('PORT', '5000'), 10),

  /** MongoDB connection URI */
  MONGODB_URI: requireEnv('MONGODB_URI', 'mongodb://localhost:27017/edusmart'),

  /** JWT signing secret (must be cryptographically strong in production) */
  JWT_SECRET: requireEnv('JWT_SECRET', 'change_this_in_production'),

  /** JWT token expiry duration (e.g. '7d', '24h') */
  JWT_EXPIRES_IN: requireEnv('JWT_EXPIRES_IN', '7d'),

  /** URL of the ML/AI microservice */
  ML_SERVICE_URL: requireEnv('ML_SERVICE_URL', 'http://localhost:8000'),

  /** Current Node environment */
  NODE_ENV: requireEnv('NODE_ENV', 'development'),

  /** Allowed CORS origin(s) */
  CORS_ORIGIN: requireEnv('CORS_ORIGIN', 'http://localhost:5173'),
};

// Warn in non-production if default JWT_SECRET is still in use
if (config.NODE_ENV === 'production' && config.JWT_SECRET === 'change_this_in_production') {
  throw new Error(
    '🚨 CRITICAL: JWT_SECRET must be changed from its default value in production!'
  );
}

if (config.NODE_ENV !== 'production') {
  console.log('⚙️  Environment Config Loaded:', {
    PORT: config.PORT,
    NODE_ENV: config.NODE_ENV,
    MONGODB_URI: config.MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@'), // mask credentials
    JWT_EXPIRES_IN: config.JWT_EXPIRES_IN,
    ML_SERVICE_URL: config.ML_SERVICE_URL,
    CORS_ORIGIN: config.CORS_ORIGIN,
  });
}

export default config;
