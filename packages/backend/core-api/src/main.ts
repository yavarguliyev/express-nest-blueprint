import 'reflect-metadata';

import { getErrorMessage } from '@config/libs';
import { AppBootstrap } from '@bootstrap/main.bootstrap';

new AppBootstrap().start().catch(error => {
  process.stderr.write(`Startup failed: ${getErrorMessage(error)}\n`);
  process.exit(1);
});
