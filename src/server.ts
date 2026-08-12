import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { SchedulerService } from './services/scheduler.service.js';

const PORT = env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Wahub Backend REST API server running on port ${PORT}`);
  logger.info(`Environment: ${env.NODE_ENV}`);
  logger.info(`OpenAPI docs available at http://localhost:${PORT}/api/docs/ui`);

  SchedulerService.init();
});
