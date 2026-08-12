"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsOptions = void 0;
const env_js_1 = require("./env.js");
exports.corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, postman)
        if (!origin || origin === env_js_1.env.FRONTEND_URL || env_js_1.env.NODE_ENV === 'development') {
            callback(null, true);
        }
        else {
            callback(null, true); // Allow for flexibility in development/test
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};
