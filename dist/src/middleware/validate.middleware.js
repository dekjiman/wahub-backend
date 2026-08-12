"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const zod_1 = require("zod");
const api_response_js_1 = require("../utils/api-response.js");
const validateRequest = (schema) => {
    return (req, res, next) => {
        try {
            req.body = schema.parse(req.body);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const errors = error.errors.map((err) => ({
                    code: 'VALIDATION_ERROR',
                    message: err.message,
                    field: err.path.join('.'),
                }));
                return api_response_js_1.ApiResponse.error(res, errors, 400);
            }
            return api_response_js_1.ApiResponse.error(res, { code: 'VALIDATION_ERROR', message: 'Invalid request data' }, 400);
        }
    };
};
exports.validateRequest = validateRequest;
