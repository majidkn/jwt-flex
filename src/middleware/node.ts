import { IncomingMessage } from 'http';
import { InvalidTokenError, MalformedTokenError, TokenExpiredError } from '../core/errors';
import { extractToken } from '../core/extractors';
import { verifyToken } from '../core/token';
import { NodeJwtOptions, TokenErrorCode, VerifyRequestResult } from '../types/middleware';

export type { NodeJwtOptions, VerifyRequestResult };

export async function verifyRequest<T extends object>(
  req: IncomingMessage,
  options: NodeJwtOptions,
): Promise<VerifyRequestResult<T>> {
  const { credentialsRequired = true, ...tokenOptions } = options;

  try {
    const token = extractToken(req, options);

    if (!token) {
      if (credentialsRequired) {
        return {
          isAuthenticated: false,
          error: {
            code: TokenErrorCode.MISSING,
            message: 'No authorization token was found',
          },
        };
      }
      return { isAuthenticated: true };
    }

    const payload = await verifyToken<T>(token, tokenOptions);
    return {
      isAuthenticated: true,
      payload,
    };
  } catch (error) {
    const errorMap = {
      [TokenExpiredError.name]: { code: TokenErrorCode.EXPIRED, message: 'Token has expired' },
      [InvalidTokenError.name]: {
        code: TokenErrorCode.INVALID,
        message: 'Invalid token signature',
      },
      [MalformedTokenError.name]: { code: TokenErrorCode.MALFORMED, message: 'Malformed token' },
    };

    if (error instanceof Error && error.constructor.name in errorMap) {
      return {
        isAuthenticated: false,
        error: {
          code: errorMap[error.constructor.name].code as TokenErrorCode,
          message: errorMap[error.constructor.name].message as string,
        },
      };
    }
    throw error;
  }
}
