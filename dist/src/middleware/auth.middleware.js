"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateJwt = void 0;
const jwt_js_1 = require("../utils/jwt.js");
const api_response_js_1 = require("../utils/api-response.js");
const authenticateJwt = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return api_response_js_1.ApiResponse.error(res, { code: 'UNAUTHORIZED', message: 'Missing or invalid token' }, 401);
    }
    const token = authHeader.split(' ')[1];
    try {
        const payload = (0, jwt_js_1.verifyToken)(token);
        req.user = payload;
        next();
    }
    catch (error) {
        return api_response_js_1.ApiResponse.error(res, { code: 'UNAUTHORIZED', message: 'Token expired or invalid' }, 401);
    }
};
exports.authenticateJwt = authenticateJwt;
