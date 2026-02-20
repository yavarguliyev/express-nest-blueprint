import { Module } from '@config/libs';

import { UsersController } from '@modules/users/users.controller';
import { UsersRepository } from '@modules/users/users.repository';
import { UsersResolver } from '@modules/users/users.resolver';
import { UsersService } from '@modules/users/users.service';
import { UsersSubscriber } from '@modules/users/subscribers/users.subscriber';
import { UsersCommandsWorker } from '@modules/users/workers/users-commands.worker';
import { UserCreationService } from '@modules/users/services/user-creation.service';
import { UserUpdateService } from '@modules/users/services/user-update.service';
import { UserQueryService } from '@modules/users/services/user-query.service';

@Module({
  imports: [],
  controllers: [UsersController],
  providers: [
    UsersService,
    UsersRepository,
    UsersResolver,
    UsersSubscriber,
    UsersCommandsWorker,
    UserCreationService,
    UserUpdateService,
    UserQueryService
  ],
  exports: [UsersService, UsersRepository]
})
export class UsersModule {}
