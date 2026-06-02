import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

/**
 * Allows only SELLER and ADMIN users that are already linked to a company.
 */
@Injectable()
export class SellerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    if (user.role !== 'SELLER' && user.role !== 'ADMIN') {
      throw new ForbiddenException('Only sellers can perform this action');
    }

    if (!user.companyId) {
      throw new ForbiddenException(
        'Seller must be associated with a company before using this resource.',
      );
    }

    return true;
  }
}
