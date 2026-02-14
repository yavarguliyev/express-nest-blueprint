import 'reflect-metadata';

import { AppBootstrap } from '@bootstrap/main.bootstrap';

new AppBootstrap().start().catch(() => process.exit(1));
