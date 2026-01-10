import { ApiController, BaseController } from '@common/controllers';
import { Injectable, Body, Post } from '@common/decorators';
import { AuthResponseDto, LoginDto, RegisterDto } from '@modules/auth/dtos';
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
