"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeModerationSchema = void 0;
const zod_1 = require("zod");
exports.executeModerationSchema = zod_1.z.object({
    action_taken: zod_1.z.string().optional().default('warned_member'),
});
