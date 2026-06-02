import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Reads the authenticated user attached to the current HTTP request.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
