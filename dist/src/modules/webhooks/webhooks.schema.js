"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evolutionGoWebhookSchema = void 0;
const zod_1 = require("zod");
exports.evolutionGoWebhookSchema = zod_1.z
    .object({
    event: zod_1.z.string().min(1, 'event is required'),
    data: zod_1.z.unknown().optional(),
    instanceName: zod_1.z.string().optional(),
    instanceId: zod_1.z.string().optional(),
    instanceToken: zod_1.z.string().optional(),
})
    .passthrough();
