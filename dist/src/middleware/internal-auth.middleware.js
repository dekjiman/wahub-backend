"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.internalAuthMiddleware = void 0;
const api_response_js_1 = require("../utils/api-response.js");
const env_js_1 = require("../config/env.js");
const internalAuthMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const headerToken = authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : req.headers['x-internal-token'];
    const validToken = env_js_1.env.N8N_INTERNAL_TOKEN;
    if (!headerToken || headerToken !== validToken) {
        return api_response_js_1.ApiResponse.error(res, { code: 'UNAUTHORIZED', message: 'Missing or invalid internal service token' }, 401);
    }
    next();
};
exports.internalAuthMiddleware = internalAuthMiddleware;
