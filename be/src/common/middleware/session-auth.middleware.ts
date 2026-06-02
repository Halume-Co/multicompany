import { Injectable, NestMiddleware } from '@nestjs/common';
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';
import { AuthService } from '../../modules/auth/auth.service';

@Injectable()
export class SessionAuthMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService) {}

  async use(
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction,
  ): Promise<void> {
    const authContext = await this.authService.resolveSession(req);

    if (authContext) {
      req.user = authContext.user;
      req.session = {
        id: authContext.session.id,
        expiresAt: authContext.session.expiresAt,
      };
      req.sessionToken = authContext.sessionToken;
    }

    next();
  }
}
