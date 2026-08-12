"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const api_response_js_1 = require("../utils/api-response.js");
const logger_js_1 = require("../utils/logger.js");
const errorHandler = (err, req, res, next) => {
    logger_js_1.logger.error('Unhandled error:', err);
    const statusCode = err.statusCode || err.status || 500;
    const message = err.message || 'Internal Server Error';
    return api_response_js_1.ApiResponse.error(res, {
        code: err.code || 'INTERNAL_SERVER_ERROR',
        message,
    }, statusCode);
};
exports.errorHandler = errorHandler;
