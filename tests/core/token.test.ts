import jwt from 'jsonwebtoken';
import { InvalidTokenError, MalformedTokenError, TokenExpiredError } from '../../src/core/errors';
import { signToken, verifyToken } from '../../src/core/token';

describe('Token Functions', () => {
  const secret = 'test-secret';
  const payload = { userId: 1, role: 'admin' };

  beforeEach(() => {
    jest.resetAllMocks();
    // Mock jwt.sign to return a valid token by default
    jest.spyOn(jwt, 'sign').mockImplementation(() => 'valid.mock.token');
    // Mock jwt.verify to return the payload by default
    jest.spyOn(jwt, 'verify').mockImplementation(() => payload);
  });

  describe('signToken', () => {
    it('should sign a payload and return a valid JWT', async () => {
      const token = await signToken(payload, { secret });
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should use the specified algorithm', async () => {
      const mockSign = jest.spyOn(jwt, 'sign');
      await signToken(payload, { secret, algorithm: 'HS384' });
      expect(mockSign).toHaveBeenCalledWith(payload, secret, {
        algorithm: 'HS384',
        expiresIn: '1h',
      });
    });

    it('should set expiration time', async () => {
      const mockSign = jest.spyOn(jwt, 'sign');
      await signToken(payload, { secret, expiresIn: '2h' });
      expect(mockSign).toHaveBeenCalledWith(payload, secret, {
        algorithm: 'HS256',
        expiresIn: '2h',
      });
    });

    it('should handle non-Error signing failures', async () => {
      // Mock jwt.sign to throw a non-Error
      const mockSign = jest.spyOn(jwt, 'sign');
      mockSign.mockImplementationOnce(() => {
        throw new Error('Non-error thrown');
      });

      await expect(signToken(payload, { secret })).rejects.toThrow('Non-error thrown');
    });

    it('should handle Error signing failures', async () => {
      // Mock jwt.sign to throw an Error
      const mockSign = jest.spyOn(jwt, 'sign');
      mockSign.mockImplementationOnce(() => {
        throw new Error('Signing failed');
      });

      await expect(signToken(payload, { secret })).rejects.toThrow(
        'Failed to sign token: Signing failed',
      );
    });
  });

  describe('verifyToken', () => {
    let validToken: string;

    beforeEach(async () => {
      validToken = await signToken(payload, { secret });
    });

    it('should verify and decode a valid token', async () => {
      const decoded = await verifyToken(validToken, { secret });
      expect(decoded).toMatchObject(payload);
    });

    it('should throw TokenExpiredError for expired tokens', async () => {
      const mockVerify = jest.spyOn(jwt, 'verify');
      const tokenExpiredError = new jwt.TokenExpiredError('jwt expired', new Date());
      mockVerify.mockImplementationOnce(() => {
        throw tokenExpiredError;
      });

      await expect(verifyToken(validToken, { secret })).rejects.toThrow(TokenExpiredError);
    });

    it('should throw InvalidTokenError for tokens with invalid signature', async () => {
      const mockVerify = jest.spyOn(jwt, 'verify');
      const jsonWebTokenError = new jwt.JsonWebTokenError('invalid signature');
      mockVerify.mockImplementationOnce(() => {
        throw jsonWebTokenError;
      });

      await expect(verifyToken(validToken, { secret })).rejects.toThrow(InvalidTokenError);
    });

    it('should throw MalformedTokenError for malformed tokens', async () => {
      const mockVerify = jest.spyOn(jwt, 'verify');
      const jsonWebTokenError = new jwt.JsonWebTokenError('invalid token');
      mockVerify.mockImplementationOnce(() => {
        throw jsonWebTokenError;
      });

      await expect(verifyToken(validToken, { secret })).rejects.toThrow(MalformedTokenError);
    });

    it('should verify tokens with specified algorithms', async () => {
      const mockVerify = jest.spyOn(jwt, 'verify');
      mockVerify.mockImplementationOnce(() => payload);

      const decoded = await verifyToken(validToken, { secret, algorithms: ['HS384'] });
      expect(decoded).toMatchObject(payload);
      expect(mockVerify).toHaveBeenCalledWith(validToken, secret, { algorithms: ['HS384'] });
    });

    it('should handle unknown jwt errors', async () => {
      const mockVerify = jest.spyOn(jwt, 'verify');
      mockVerify.mockImplementationOnce(() => {
        throw new Error('Unknown error');
      });

      await expect(verifyToken(validToken, { secret })).rejects.toThrow('Unknown error');
    });

    it('should handle non-Error verification failures', async () => {
      const mockVerify = jest.spyOn(jwt, 'verify');
      mockVerify.mockImplementationOnce(() => {
        throw new Error('Non-error thrown');
      });

      await expect(verifyToken(validToken, { secret })).rejects.toThrow('Non-error thrown');
    });
  });
});
