"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRedisConnected = exports.redisClient = exports.getRedisClient = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const env_js_1 = require("./env.js");
let redisClient = null;
exports.redisClient = redisClient;
let isRedisConnected = false;
exports.isRedisConnected = isRedisConnected;
try {
    exports.redisClient = redisClient = new ioredis_1.default(env_js_1.env.REDIS_URL, {
        maxRetriesPerRequest: 1,
        retryStrategy(times) {
            if (times > 3) {
                return null; // Stop retrying after 3 attempts
            }
            return Math.min(times * 100, 2000);
        },
    });
    redisClient.on('connect', () => {
        exports.isRedisConnected = isRedisConnected = true;
    });
    redisClient.on('error', (err) => {
        exports.isRedisConnected = isRedisConnected = false;
    });
}
catch (error) {
    exports.isRedisConnected = isRedisConnected = false;
}
const getRedisClient = () => {
    return isRedisConnected ? redisClient : null;
};
exports.getRedisClient = getRedisClient;
