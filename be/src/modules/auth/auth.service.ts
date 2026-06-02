import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Role, Session, User } from '@prisma/client';
import { Response } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import {
  generateSessionToken,
  hashPassword,
  hashSessionToken,
  normalizeEmail,
  verifyPassword,
} from './auth.utils';

interface SessionContext {
  user: AuthenticatedUser;
  session: Session;
  sessionToken: string;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: 'buyer' | 'seller' | 'admin';
  companyId: string | null;
  createdAt?: Date;
}

@Injectable()
export class AuthService {
  private readonly loginAttempts = new Map<
    string,
    { count: number; resetAt: number }
  >();

  constructor(private readonly prisma: PrismaService) {}

  async register(
    dto: RegisterDto,
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<{ user: PublicUser }> {
    const email = normalizeEmail(dto.email);
    const existingUser = await this.prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    const user = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email,
        password: await hashPassword(dto.password),
        role: dto.role === 'seller' ? Role.SELLER : Role.BUYER,
      },
    });

    await this.issueSession(user, req, res);

    return { user: this.serializeUser(user) };
  }

  async updateProfile(
    dto: UpdateProfileDto,
    user: AuthenticatedUser,
  ): Promise<{ user: PublicUser }> {
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        ...(dto.name && { name: dto.name.trim() }),
      },
    });

    return { user: this.serializeUser(updated) };
  }

  async login(
    dto: LoginDto,
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<{ user: PublicUser }> {
    const email = normalizeEmail(dto.email);
    const loginKey = this.getLoginAttemptKey(email, req.ip);
    this.assertLoginAllowed(loginKey);

    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !(await verifyPassword(dto.password, user.password))) {
      this.recordFailedLogin(loginKey);
      throw new UnauthorizedException('Invalid email or password');
    }

    this.clearFailedLogin(loginKey);
    await this.issueSession(user, req, res);

    return { user: this.serializeUser(user) };
  }

  async logout(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<{ success: true }> {
    if (req.sessionToken) {
      await this.prisma.session.deleteMany({
        where: {
          tokenHash: hashSessionToken(req.sessionToken),
        },
      });
    }

    this.clearAuthenticationCookie(res);
    return { success: true };
  }

  async resolveSession(
    req: AuthenticatedRequest,
  ): Promise<SessionContext | null> {
    const sessionToken = this.extractSessionToken(req);

    if (!sessionToken) {
      return null;
    }

    const session = await this.prisma.session.findFirst({
      where: {
        tokenHash: hashSessionToken(sessionToken),
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: true,
      },
    });

    if (!session) {
      return null;
    }

    if (this.shouldTouchSession(session)) {
      void this.prisma.session.update({
        where: { id: session.id },
        data: { lastUsedAt: new Date() },
      });
    }

    return {
      user: this.toAuthenticatedUser(session.user),
      session,
      sessionToken,
    };
  }

  serializeAuthenticatedUser(user: AuthenticatedUser): PublicUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: this.toPublicRole(user.role),
      companyId: user.companyId ?? null,
      createdAt: user.createdAt,
    };
  }

  private async issueSession(
    user: User,
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    const sessionToken = generateSessionToken();
    const expiresAt = this.getSessionExpiry();

    await this.prisma.session.create({
      data: {
        tokenHash: hashSessionToken(sessionToken),
        expiresAt,
        userId: user.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    res.cookie(
      this.getSessionCookieName(),
      sessionToken,
      this.getAuthenticationCookieOptions(expiresAt),
    );
  }

  private clearAuthenticationCookie(res: Response): void {
    res.clearCookie(this.getSessionCookieName(), {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  }

  private extractSessionToken(req: AuthenticatedRequest): string | null {
    const bearer = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (bearer) {
      return bearer;
    }

    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) {
      return null;
    }

    const cookies = cookieHeader.split(';').map((entry) => entry.trim());

    for (const cookie of cookies) {
      const separatorIndex = cookie.indexOf('=');
      if (separatorIndex === -1) continue;

      const key = cookie.slice(0, separatorIndex);
      const value = cookie.slice(separatorIndex + 1);

      if (key === this.getSessionCookieName()) {
        return decodeURIComponent(value);
      }
    }

    return null;
  }

  private getAuthenticationCookieOptions(expiresAt: Date) {
    return {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      expires: expiresAt,
    };
  }

  private getSessionCookieName(): string {
    return process.env.SESSION_COOKIE_NAME?.trim() || 'shoe_marketplace_session';
  }

  private getSessionExpiry(): Date {
    const ttlDays = Number(process.env.SESSION_TTL_DAYS || 7);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + ttlDays);
    return expiresAt;
  }

  private shouldTouchSession(session: Session): boolean {
    const lastUsedAt = session.lastUsedAt?.getTime() ?? 0;
    return Date.now() - lastUsedAt > 5 * 60 * 1000;
  }

  private toAuthenticatedUser(user: User): AuthenticatedUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
      createdAt: user.createdAt,
    };
  }

  private serializeUser(user: User): PublicUser {
    return this.serializeAuthenticatedUser(this.toAuthenticatedUser(user));
  }

  private toPublicRole(role: Role): PublicUser['role'] {
    switch (role) {
      case Role.ADMIN:
        return 'admin';
      case Role.SELLER:
        return 'seller';
      default:
        return 'buyer';
    }
  }

  private getLoginAttemptKey(email: string, ipAddress?: string): string {
    return `${email}:${ipAddress ?? 'unknown'}`;
  }

  private assertLoginAllowed(key: string): void {
    const maxAttempts = Number(process.env.AUTH_MAX_LOGIN_ATTEMPTS || 5);
    const windowMs = Number(process.env.AUTH_LOGIN_WINDOW_MS || 15 * 60 * 1000);
    const currentAttempt = this.loginAttempts.get(key);

    if (!currentAttempt) {
      return;
    }

    if (Date.now() > currentAttempt.resetAt) {
      this.loginAttempts.delete(key);
      return;
    }

    if (currentAttempt.count >= maxAttempts) {
      const retryAfterSeconds = Math.ceil(
        (currentAttempt.resetAt - Date.now()) / 1000,
      );
      throw new HttpException(
        `Too many login attempts. Try again in ${retryAfterSeconds} seconds.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (currentAttempt.resetAt - Date.now() > windowMs) {
      this.loginAttempts.delete(key);
    }
  }

  private recordFailedLogin(key: string): void {
    const windowMs = Number(process.env.AUTH_LOGIN_WINDOW_MS || 15 * 60 * 1000);
    const currentAttempt = this.loginAttempts.get(key);

    if (!currentAttempt || Date.now() > currentAttempt.resetAt) {
      this.loginAttempts.set(key, {
        count: 1,
        resetAt: Date.now() + windowMs,
      });
      return;
    }

    this.loginAttempts.set(key, {
      count: currentAttempt.count + 1,
      resetAt: currentAttempt.resetAt,
    });
  }

  private clearFailedLogin(key: string): void {
    this.loginAttempts.delete(key);
  }
}
