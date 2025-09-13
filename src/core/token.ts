import jwt from 'jsonwebtoken';
import { InvalidTokenError, MalformedTokenError, TokenExpiredError } from './errors';
import { JwtOptions, VerifyOptions } from './types';

/**
 * Signs a payload and returns a JWT token
 * @param payload - The payload to sign
 * @param options - JWT options including secret and optional parameters
 * @returns Promise<string> - The signed JWT token
 */
export async function signToken<T extends object>(
  payload: T,
  options: JwtOptions,
): Promise<string> {
  try {
    const { secret, expiresIn = '1h', algorithm = 'HS256' } = options;
    return jwt.sign(payload, secret, {
      expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
      algorithm,
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to sign token: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Verifies a JWT token and returns the decoded payload
 * @param token - The JWT token to verify
 * @param options - Verification options including secret and optional parameters
 * @returns Promise<T> - The decoded payload
 */
export async function verifyToken<T extends object>(
  token: string,
  options: VerifyOptions,
): Promise<T> {
  try {
    const { secret, algorithms = ['HS256'] } = options;
    return jwt.verify(token, secret, { algorithms }) as T;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new TokenExpiredError();
    }
    if (error instanceof jwt.JsonWebTokenError) {
      const msg = error.message.toLowerCase();
      if (msg.includes('signature')) {
        throw new InvalidTokenError();
      }
      if (msg.includes('malformed') || msg.includes('invalid token')) {
        throw new MalformedTokenError();
      }
      throw new InvalidTokenError();
    }
    throw error;
  }
}
