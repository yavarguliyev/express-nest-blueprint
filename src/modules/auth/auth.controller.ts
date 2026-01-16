import { ApiController, BaseController } from '@common/controllers/base.controller';
import { Injectable } from '@common/decorators/injectable.decorator';
import { Post } from '@common/decorators/route.decorators';
import { Body } from '@common/decorators/param.decorators';
import { AuthResponseDto } from '@modules/auth/dtos/auth-response.dto';
import { LoginDto } from '@modules/auth/dtos/login.dto';
import {  RegisterDto } from '@modules/auth/dtos/register.dto';
import { AuthService } from '@modules/auth/auth.service';

@Injectable()
@ApiController({ path: '/auth' })
export class AuthController extends BaseController {
  constructor (private readonly authService: AuthService) {
    super({ path: '/auth' });
  }

  @Post('/login')
  async login (@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('/register')
  async register (@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }
}
