import { JwtOptions, TokenExtractorOptions } from '../core/types';

/**
 * Base interface for JWT middleware options
 */
export interface BaseJwtOptions extends JwtOptions, TokenExtractorOptions {
  credentialsRequired?: boolean;
}

/**
 * Express middleware options
 */
export interface ExpressJwtOptions extends BaseJwtOptions {}

/**
 * Fastify plugin options
 */
export interface FastifyJwtOptions extends BaseJwtOptions {}

/**
 * NestJS guard options
 */
export interface NestJwtOptions extends BaseJwtOptions {}

/**
 * Node.js HTTP middleware options
 */
export interface NodeJwtOptions extends BaseJwtOptions {}

/**
 * Result of verifying a request in Node.js HTTP middleware
 */
export enum TokenErrorCode {
  MISSING = 'TOKEN_MISSING',
  EXPIRED = 'TOKEN_EXPIRED',
  INVALID = 'TOKEN_INVALID',
  MALFORMED = 'TOKEN_MALFORMED',
}

interface TokenError {
  code: TokenErrorCode;
  message: string;
}

export interface VerifyRequestResult<T> {
  isAuthenticated: boolean;
  payload?: T;
  error?: TokenError;
}
