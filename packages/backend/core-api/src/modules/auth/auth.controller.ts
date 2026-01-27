import { ApiController, BaseController, Injectable, Post, Body, UserRoles } from '@config/libs';

import { AuthResponseDto } from '@modules/auth/dtos/auth-response.dto';
import { LoginDto } from '@modules/auth/dtos/login.dto';
import { RegisterDto } from '@modules/auth/dtos/register.dto';
import { AuthService } from '@modules/auth/auth.service';

@Injectable()
@ApiController({ path: '/auth' })
export class AuthController extends BaseController {
  constructor (private readonly authService: AuthService) {
    super({ path: '/auth' });
  }

  @Post('/login')
  async login (@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto, {
      allowedRoles: [UserRoles.GLOBAL_ADMIN, UserRoles.ADMIN, UserRoles.MODERATOR, UserRoles.USER],
      context: 'user portal'
    });
  }

  @Post('/admin-login')
  async adminLogin (@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto, { allowedRoles: [UserRoles.GLOBAL_ADMIN, UserRoles.ADMIN], context: 'admin portal' });
  }

  @Post('/register')
  async register (@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }
}
