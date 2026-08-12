"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_js_1 = require("./app.js");
const env_js_1 = require("./config/env.js");
const logger_js_1 = require("./utils/logger.js");
const scheduler_service_js_1 = require("./services/scheduler.service.js");
const PORT = env_js_1.env.PORT || 3000;
app_js_1.app.listen(PORT, () => {
    logger_js_1.logger.info(`Wahub Backend REST API server running on port ${PORT}`);
    logger_js_1.logger.info(`Environment: ${env_js_1.env.NODE_ENV}`);
    logger_js_1.logger.info(`OpenAPI docs available at http://localhost:${PORT}/api/docs/ui`);
    scheduler_service_js_1.SchedulerService.init();
});
