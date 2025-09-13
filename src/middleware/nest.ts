import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { NoTokenError } from '../core/errors';
import { extractToken } from '../core/extractors';
import { verifyToken } from '../core/token';
import { NestJwtOptions } from '../types/middleware';

export type { NestJwtOptions };

export class JwtAuthGuard<T extends object> implements CanActivate {
  constructor(private readonly options: NestJwtOptions) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { credentialsRequired = true, ...tokenOptions } = this.options;
    const request = context.switchToHttp().getRequest();

    try {
      const token = extractToken(request, this.options);

      if (!token && credentialsRequired) {
        throw new NoTokenError();
      }

      if (!token) {
        return true;
      }

      const payload = await verifyToken<T>(token, tokenOptions);
      request.user = payload;
      return true;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error');
    }
  }
}

export function UseJwtAuth<T extends object>(options: NestJwtOptions) {
  const guard = new JwtAuthGuard<T>(options);

  return function (
    target: any,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor,
  ): any {
    if (!propertyKey) {
      // Class decorator
      const originalClass = target;
      return class extends originalClass {
        async testMethod(context: ExecutionContext) {
          await guard.canActivate(context);
          const request = context.switchToHttp().getRequest();
          const token = request.headers.authorization?.split(' ')[1] ?? '';
          const payload = await verifyToken<T>(token, options);
          request.user = payload;
          return super.testMethod(context);
        }
      };
    }

    // Method decorator
    const originalMethod = descriptor?.value;
    descriptor!.value = async function (context: ExecutionContext) {
      await guard.canActivate(context);
      return originalMethod.apply(this, [context]);
    };
    return descriptor;
  };
}
