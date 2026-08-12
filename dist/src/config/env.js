"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), '.env') });
exports.env = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '3000', 10),
    DATABASE_URL: process.env.DATABASE_URL ||
        'postgresql://wahub:password@localhost:5432/wahub',
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
    JWT_SECRET: process.env.JWT_SECRET ||
        'wahub-super-secret-jwt-key-change-in-production-2026',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
    EVOLUTION_API_URL: process.env.EVOLUTION_API_URL || 'http://localhost:8080',
    EVOLUTION_API_KEY: process.env.EVOLUTION_API_KEY || 'wahub-evolution-api-key-2026',
    EVOLUTION_WEBHOOK_URL: process.env.EVOLUTION_WEBHOOK_URL ||
        'http://n8n:5678/webhook/evolution-webhook',
    EVOLUTION_DEFAULT_INSTANCE: process.env.EVOLUTION_DEFAULT_INSTANCE || 'wahub-main',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
    OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
    N8N_INTERNAL_TOKEN: process.env.N8N_INTERNAL_TOKEN || 'wahub-n8n-internal-token-2026',
    N8N_WEBHOOK_URL: process.env.N8N_WEBHOOK_URL || '',
};
