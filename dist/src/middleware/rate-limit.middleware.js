"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRateLimiter = exports.authRateLimiter = exports.createRateLimiter = void 0;
const api_response_js_1 = require("../utils/api-response.js");
const store = {};
// Clean up expired IP keys periodically to prevent memory leaks
setInterval(() => {
    const now = Date.now();
    for (const key of Object.keys(store)) {
        if (store[key].resetTime < now) {
            delete store[key];
        }
    }
}, 5 * 60 * 1000);
const createRateLimiter = (windowMs = 15 * 60 * 1000, maxRequests = 100) => {
    return (req, res, next) => {
        // In vitest/test environment, bypass rate limit so test suites run smoothly
        if (process.env.NODE_ENV === 'test') {
            return next();
        }
        const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
        const key = `${req.path}:${ip}`;
        const now = Date.now();
        if (!store[key] || store[key].resetTime < now) {
            store[key] = {
                count: 1,
                resetTime: now + windowMs,
            };
            return next();
        }
        store[key].count++;
        if (store[key].count > maxRequests) {
            const retryAfter = Math.ceil((store[key].resetTime - now) / 1000);
            res.setHeader('Retry-After', String(retryAfter));
            return api_response_js_1.ApiResponse.error(res, {
                code: 'RATE_LIMIT_EXCEEDED',
                message: `Too many requests. Please try again in ${retryAfter} seconds.`,
            }, 429);
        }
        next();
    };
};
exports.createRateLimiter = createRateLimiter;
exports.authRateLimiter = (0, exports.createRateLimiter)(15 * 60 * 1000, 20); // 20 login attempts per 15 min
exports.apiRateLimiter = (0, exports.createRateLimiter)(1 * 60 * 1000, 300); // 300 requests per 1 min
