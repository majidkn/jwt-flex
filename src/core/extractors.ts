import { IncomingMessage } from 'http';
import { TokenExtractor, TokenExtractorOptions } from './types';

/**
 * Creates an extractor that gets token from Authorization header with Bearer scheme
 * @example
 * // Authorization: Bearer <token>
 * const extractor = fromAuthHeaderAsBearerToken();
 * const token = extractor(request);
 * @returns TokenExtractor function
 */
export const fromAuthHeaderAsBearerToken = (): TokenExtractor => {
  return (
    req: IncomingMessage | { headers?: Record<string, string | string[] | undefined> },
  ): string | null => {
    const auth = req.headers?.authorization;
    if (typeof auth === 'string') {
      const parts = auth.split(' ');
      if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
        return parts[1];
      }
    }
    return null;
  };
};

/**
 * Creates an extractor that gets token from a query parameter
 * @param param - The query parameter name to extract token from (default: 'token')
 * @example
 * // URL: /api/resource?token=<token>
 * const extractor = fromQueryParameter('token');
 * const token = extractor(request);
 * @returns TokenExtractor function
 */
export const fromQueryParameter = (param: string = 'token'): TokenExtractor => {
  return (req: IncomingMessage | { query?: Record<string, string | undefined> }): string | null => {
    if (req instanceof IncomingMessage) {
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      return url.searchParams.get(param);
    }
    return req.query?.[param] || null;
  };
};

/**
 * Creates an extractor that gets token from a cookie
 * @param cookieName - The cookie name to extract token from (default: 'token')
 * @example
 * // Cookie: token=<token>
 * const extractor = fromCookie('token');
 * const token = extractor(request);
 * @returns TokenExtractor function
 */
export const fromCookie = (cookieName: string = 'token'): TokenExtractor => {
  return (
    req: IncomingMessage | { cookies?: Record<string, string | undefined> },
  ): string | null => {
    if (req instanceof IncomingMessage) {
      const cookies = req.headers.cookie?.split(';').reduce(
        (acc, cookie) => {
          const [key, value] = cookie.trim().split('=');
          acc[key] = value;
          return acc;
        },
        {} as Record<string, string>,
      );
      return cookies?.[cookieName] || null;
    }
    return req.cookies?.[cookieName] || null;
  };
};

/**
 * Extracts token using provided extractors with fallback
 * @param req - The HTTP request object
 * @param options - Token extractor options
 * @example
 * const token = extractToken(request, {
 *   extractors: [
 *     fromAuthHeaderAsBearerToken(),
 *     fromCookie('auth-token'),
 *     fromQueryParameter('access_token')
 *   ]
 * });
 * @returns string | null - The extracted token or null if not found
 */
export const extractToken = (
  req:
    | IncomingMessage
    | {
        headers?: Record<string, string | string[] | undefined>;
        query?: Record<string, string | undefined>;
        cookies?: Record<string, string | undefined>;
      },
  options: TokenExtractorOptions = {},
): string | null => {
  const extractors = options.extractors || [fromAuthHeaderAsBearerToken()];

  for (const extractor of extractors) {
    const token = extractor(req);
    if (token) {
      return token;
    }
  }

  return null;
};
