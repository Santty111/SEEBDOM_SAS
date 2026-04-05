/**
 * Error operacional predecible (no filtra stack al cliente salvo en desarrollo).
 */
export class AppError extends Error {
  /**
   * @param {string} message
   * @param {number} [statusCode=500]
   * @param {string} [code='ERROR']
   */
  constructor(message, statusCode = 500, code = 'ERROR') {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
  }
}
