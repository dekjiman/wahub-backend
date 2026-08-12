"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponse = void 0;
class ApiResponse {
    static success(res, data, statusCode = 200) {
        return res.status(statusCode).json({ data });
    }
    static successWithMeta(res, data, meta, statusCode = 200) {
        return res.status(statusCode).json({ data, meta });
    }
    static error(res, errors, statusCode = 400) {
        const errorArray = Array.isArray(errors) ? errors : [errors];
        return res.status(statusCode).json({ errors: errorArray });
    }
    static noContent(res) {
        return res.status(204).send();
    }
}
exports.ApiResponse = ApiResponse;
