"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthToken = getAuthToken;
const supertest_1 = __importDefault(require("supertest"));
const app_js_1 = require("../app.js");
async function getAuthToken() {
    const res = await (0, supertest_1.default)(app_js_1.app)
        .post('/api/v1/auth/login')
        .send({
        email: 'admin@wahub.com',
        password: 'password123',
    });
    return res.body.data.token;
}
