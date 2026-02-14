import { Module } from '@config/libs';

import { UsersController } from '@modules/users/users.controller';
import { UsersRepository } from '@modules/users/users.repository';
import { UsersResolver } from '@modules/users/users.resolver';
import { UsersService } from '@modules/users/users.service';
import { UsersSubscriber } from '@modules/users/subscribers/users.subscriber';
import { UsersCommandsWorker } from '@modules/users/workers/users-commands.worker';

@Module({
  imports: [],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, UsersResolver, UsersSubscriber, UsersCommandsWorker],
  exports: [UsersService, UsersRepository]
})
export class UsersModule {}
