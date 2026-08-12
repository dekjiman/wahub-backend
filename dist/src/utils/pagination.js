"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaginationParams = void 0;
const getPaginationParams = (req) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const perPage = Math.min(100, Math.max(1, parseInt(req.query.per_page, 10) || 20));
    const offset = (page - 1) * perPage;
    return { page, perPage, offset };
};
exports.getPaginationParams = getPaginationParams;
