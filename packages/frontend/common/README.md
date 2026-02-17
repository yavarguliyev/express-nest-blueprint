# @app/common

Shared frontend library providing reusable utilities, services, components, and patterns for Angular applications.

## Overview

This library follows the architectural pattern established by `packages/backend/common`, providing a centralized location for shared functionality that eliminates code duplication and reduces complexity across Angular frontend applications.

## Features

- **Unified API Communication**: Abstracted REST and GraphQL client with automatic protocol routing
- **State Management**: Signal-based state utilities including draft services, loading states, and storage
- **Form Utilities**: Enhanced form building, validation, and state management
- **Component Library**: Atomic design components (atoms, molecules, organisms)
- **Utility Functions**: Date, string, validation, and notification helpers
- **Directives & Pipes**: Reusable directives and pipes for common UI patterns
- **Guards & Interceptors**: Authentication, authorization, and error handling
- **Type Safety**: 100% TypeScript with comprehensive type definitions

## Installation

```bash
npm install @app/common
```

## Getting Started

### Import the library

```typescript
import { ApiClientService, BaseDraftService, NotificationUtil } from '@app/common';
```

### Configure API Client

```typescript
import { ApiClientService, ApiProtocol } from '@app/common';

const apiClient = inject(ApiClientService);

apiClient.configure({
  baseUrl: 'https://api.example.com',
  protocol: ApiProtocol.REST,
  timeout: 30000
});
```

### Use Utility Functions

```typescript
import { DateUtil, StringUtil, NotificationUtil } from '@app/common';

// Date utilities
const formatted = DateUtil.format(new Date(), 'yyyy-MM-dd');
const isToday = DateUtil.isToday(someDate);

// String utilities
const slug = StringUtil.slugify('Hello World'); // 'hello-world'
const camel = StringUtil.camelCase('hello-world'); // 'helloWorld'

// Notification utilities
NotificationUtil.success(notificationService, 'Operation completed successfully');
NotificationUtil.confirmDelete(notificationService, () => deleteItem(), 'User', 123);
```

### Extend Base Services

```typescript
import { BaseDraftService } from '@app/common';

interface UserDraft extends BaseDraft {
  name: string;
  email: string;
}

@Injectable()
class UserDraftService extends BaseDraftService<UserDraft, UserOperation> {
  protected readonly DRAFT_STORAGE_KEY = 'user-drafts';
  protected readonly STORAGE_VERSION = '1.0.0';
  
  protected buildOperation(draft: UserDraft): UserOperation {
    return { type: 'update', data: draft };
  }
  
  protected executePublish(operations: UserOperation[]): Observable<PublishResult> {
    return this.apiClient.post('/users/batch', { operations });
  }
  
  protected onPublishSuccess(result: PublishResult): void {
    NotificationUtil.success(this.notificationService, 'Users updated successfully');
  }
}
```

## Architecture

The library is organized into the following modules:

- **core**: Services, guards, interceptors, directives, and pipes
- **components**: Reusable UI components (atoms, molecules, organisms)
- **domain**: Type definitions, interfaces, enums, and constants
- **utils**: Pure utility functions for common operations

## Documentation

For detailed API documentation and usage examples, see the [API Reference](./docs/api-reference.md).

For migration guides from existing patterns, see the [Migration Guide](./docs/migration-guide.md).

## Development

```bash
# Build the library
npm run build

# Watch mode for development
npm run watch

# Run tests
npm run test

# Run linting
npm run lint
```

## License

MIT
