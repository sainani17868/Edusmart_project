/**
 * @module middleware/validate
 * @description Express-validator result handler middleware.
 * Collects all validation errors from express-validator chains and
 * returns a structured 422 Unprocessable Entity response when errors are found.
 */

import { validationResult } from 'express-validator';

/**
 * Middleware that reads express-validator results attached to the request.
 * If any validation errors are present, it responds with a 422 status and
 * an array of field-specific error messages.
 * If no errors, it calls next() to proceed to the route handler.
 *
 * @type {import('express').RequestHandler}
 *
 * @example
 * // Usage in a route:
 * router.post(
 *   '/register',
 *   [
 *     body('email').isEmail().withMessage('Valid email is required'),
 *     body('password').isLength({ min: 6 }).withMessage('Min 6 characters'),
 *   ],
 *   validate,
 *   authController.register
 * );
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path ?? err.param ?? 'unknown',
      message: err.msg,
      value: err.value !== undefined ? err.value : undefined,
    }));

    return res.status(422).json({
      success: false,
      message: 'Validation failed. Please check the provided data.',
      errors: formattedErrors,
    });
  }

  next();
};

export default validate;
