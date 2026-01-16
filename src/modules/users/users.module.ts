import { Module } from '@common/decorators/module.decorator';
import { UsersController } from '@modules/users/users.controller';
import { UsersRepository } from '@modules/users/users.repository';
import { UsersService } from '@modules/users/users.service';

@Module({
  imports: [],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService, UsersRepository]
})
export class UsersModule {}
