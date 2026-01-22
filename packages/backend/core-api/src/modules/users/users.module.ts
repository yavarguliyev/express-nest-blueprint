import { Module } from '@config/libs';

import { UsersController } from '@modules/users/users.controller';
import { UsersRepository } from '@modules/users/users.repository';
import { UsersResolver } from '@modules/users/users.resolver';
import { UsersService } from '@modules/users/users.service';

@Module({
  imports: [],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, UsersResolver],
  exports: [UsersService, UsersRepository]
})
export class UsersModule {}
