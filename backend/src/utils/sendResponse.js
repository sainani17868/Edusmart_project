/**
 * @module utils/sendResponse
 * @description Standardized JSON response helpers for Express route handlers.
 * Ensures all API responses follow a consistent envelope structure.
 */

/**
 * Send a successful JSON response.
 *
 * @param {import('express').Response} res - Express response object
 * @param {unknown} data - The payload to return (object, array, null, etc.)
 * @param {string} [message='Success'] - Human-readable success message
 * @param {number} [statusCode=200] - HTTP status code
 * @returns {import('express').Response}
 *
 * @example
 * sendSuccess(res, { user }, 'User created successfully', 201);
 */
export const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
  const response = {
    success: true,
    message,
    ...(data !== null && data !== undefined ? { data } : {}),
  };

  return res.status(statusCode).json(response);
};

/**
 * Send an error JSON response.
 *
 * @param {import('express').Response} res - Express response object
 * @param {string} [message='An error occurred'] - Human-readable error message
 * @param {number} [statusCode=400] - HTTP status code
 * @param {Array<{ field: string, message: string }> | null} [errors=null] - Optional field-level errors
 * @returns {import('express').Response}
 *
 * @example
 * sendError(res, 'Email already in use', 409);
 * sendError(res, 'Validation failed', 422, [{ field: 'email', message: 'Invalid email' }]);
 */
export const sendError = (
  res,
  message = 'An error occurred',
  statusCode = 400,
  errors = null
) => {
  const response = {
    success: false,
    message,
    ...(errors && Array.isArray(errors) && errors.length > 0 ? { errors } : {}),
  };

  return res.status(statusCode).json(response);
};

/**
 * Send a paginated successful response.
 *
 * @param {import('express').Response} res - Express response object
 * @param {unknown[]} data - Array of items for the current page
 * @param {{ total: number, page: number, limit: number, totalPages: number }} pagination
 * @param {string} [message='Success']
 * @param {number} [statusCode=200]
 * @returns {import('express').Response}
 *
 * @example
 * sendPaginated(res, courses, { total: 50, page: 1, limit: 10, totalPages: 5 });
 */
export const sendPaginated = (
  res,
  data,
  pagination,
  message = 'Success',
  statusCode = 200
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    pagination: {
      total: pagination.total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: pagination.totalPages,
      hasNextPage: pagination.page < pagination.totalPages,
      hasPrevPage: pagination.page > 1,
    },
  });
};
