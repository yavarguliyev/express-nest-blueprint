import { Module } from '@config/libs';

import { AuthController } from '@modules/auth/auth.controller';
import { AuthRepository } from '@modules/auth/auth.repository';
import { AuthService } from '@modules/auth/auth.service';

@Module({
  imports: [],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository],
  exports: [AuthService]
})
export class AuthModule {}
