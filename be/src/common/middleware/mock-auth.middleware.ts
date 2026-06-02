import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MockUser } from '../interfaces/mock-user.interface';

/**
 * MockAuthMiddleware
 *
 * Simulates authentication by reading mock headers and injecting
 * a user object into req.user. In production this would be replaced
 * with a JWT-based guard.
 *
 * Headers consumed:
 *   x-mock-user-id       — user UUID  (default: "buyer-user-id")
 *   x-mock-role          — BUYER | SELLER | ADMIN  (default: BUYER)
 *   x-mock-company-id    — company UUID (only for SELLER / ADMIN)
 *   x-mock-user-email    — email
 *   x-mock-user-name     — display name
 */
@Injectable()
export class MockAuthMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    const role = (
      (req.headers['x-mock-role'] as string) || 'BUYER'
    ).toUpperCase() as MockUser['role'];

    const companyId = req.headers['x-mock-company-id'] as string | undefined;

    const user: MockUser = {
      id: (req.headers['x-mock-user-id'] as string) || 'default-buyer-id',
      email:
        (req.headers['x-mock-user-email'] as string) || 'buyer@example.com',
      name: (req.headers['x-mock-user-name'] as string) || 'Default User',
      role,
      companyId: companyId || undefined,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (req as any).user = user;
    next();
  }
}
