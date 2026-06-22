import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: any }>();
    let token = this.extractTokenFromHeader(request);
    if (!token && request.query && typeof request.query['token'] === 'string') {
      token = request.query['token'];
    }

    if (!token) {
      throw new UnauthorizedException('Token đăng nhập không tồn tại');
    }

    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: number;
        email: string;
      }>(token, {
        secret: process.env.JWT_SECRET || 'super_secret_key_change_me',
      });

      // Fetch user profile from database along with role details
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { role: true },
      });

      if (!user || user.status !== 'ACTIVE') {
        throw new UnauthorizedException(
          'Tài khoản không tồn tại hoặc đã bị khóa',
        );
      }

      // Attach user object to request
      request.user = user;
    } catch {
      throw new UnauthorizedException(
        'Token đăng nhập không hợp lệ hoặc đã hết hạn',
      );
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
