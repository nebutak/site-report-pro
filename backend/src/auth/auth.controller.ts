import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(loginDto);
    return this.authService.login(user);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: unknown) {
    const typedUser = user as {
      id: number;
      name: string;
      email: string;
      role: {
        name: string;
        permissions: unknown;
      };
    };
    return {
      id: typedUser.id,
      name: typedUser.name,
      email: typedUser.email,
      role: typedUser.role.name,
      permissions: typedUser.role.permissions,
    };
  }
}
