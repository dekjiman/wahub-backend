"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSettingSchema = void 0;
const zod_1 = require("zod");
exports.updateSettingSchema = zod_1.z.object({
    value: zod_1.z.string({ required_error: 'Value is required' }),
});
