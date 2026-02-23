import 'reflect-metadata';

import { AppBootstrap } from '@bootstrap/main.bootstrap';

new AppBootstrap().start().catch(error => {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  process.stderr.write(`Startup failed: ${message}\n`);
  process.exit(1);
});
