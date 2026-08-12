"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.instanceNameSchema = exports.pairInstanceSchema = exports.connectInstanceSchema = void 0;
const zod_1 = require("zod");
exports.connectInstanceSchema = zod_1.z.object({
    instance_name: zod_1.z.string().min(1, 'Instance name is required'),
    webhook_url: zod_1.z.string().url().optional(),
});
exports.pairInstanceSchema = zod_1.z.object({
    instance_name: zod_1.z.string().min(1, 'Instance name is required'),
    phone: zod_1.z.string().min(1, 'Phone number is required'),
});
exports.instanceNameSchema = zod_1.z.object({
    instance_name: zod_1.z.string().min(1, 'Instance name is required'),
});
