/**
 * Options for signing JWT tokens
 */
export interface JwtOptions {
  secret: string;
  expiresIn?: string | number;
  algorithm?:
    | 'HS256'
    | 'HS384'
    | 'HS512'
    | 'RS256'
    | 'RS384'
    | 'RS512'
    | 'ES256'
    | 'ES384'
    | 'ES512';
}

/**
 * Options for verifying JWT tokens
 */
export interface VerifyOptions {
  secret: string;
  algorithms?: Array<
    'HS256' | 'HS384' | 'HS512' | 'RS256' | 'RS384' | 'RS512' | 'ES256' | 'ES384' | 'ES512'
  >;
}

/**
 * Function type for extracting tokens from requests
 * @param request - The HTTP request object
 * @returns string | null - The extracted token or null if not found
 */
import { IncomingMessage } from 'http';

export type TokenExtractor = (
  request:
    | IncomingMessage
    | {
        headers?: Record<string, string | string[] | undefined>;
        query?: Record<string, string | undefined>;
        cookies?: Record<string, string | undefined>;
      },
) => string | null;

/**
 * Options for configuring token extraction
 */
export interface TokenExtractorOptions {
  extractors?: TokenExtractor[];
}
