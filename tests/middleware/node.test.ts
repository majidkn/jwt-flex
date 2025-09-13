import { IncomingMessage } from 'http';
import { signToken } from '../../src/core/token';
import { verifyRequest } from '../../src/middleware/node';
import { TokenErrorCode } from '../../src/types/middleware';

describe('Node.js Request Verifier', () => {
  const secret = 'test-secret';
  const payload = { userId: 1, role: 'admin' };
  let token: string;

  beforeEach(async () => {
    token = await signToken(payload, { secret });
  });

  const mockRequest = (headers = {}): IncomingMessage => {
    return {
      headers,
      url: 'http://example.com/test',
    } as IncomingMessage;
  };

  it('should verify valid tokens', async () => {
    const req = mockRequest({
      authorization: `Bearer ${token}`,
    });

    const result = await verifyRequest(req, { secret });

    expect(result.isAuthenticated).toBe(true);
    expect(result.payload).toMatchObject(payload);
    expect(result.error).toBeUndefined();
  });

  it('should handle missing tokens when required', async () => {
    const req = mockRequest({});

    const result = await verifyRequest(req, { secret });

    expect(result.isAuthenticated).toBe(false);
    expect(result.payload).toBeUndefined();
    expect(result.error).toMatchObject({
      code: TokenErrorCode.MISSING,
      message: 'No authorization token was found',
    });
  });

  it('should allow missing tokens when not required', async () => {
    const req = mockRequest({});

    const result = await verifyRequest(req, { secret, credentialsRequired: false });

    expect(result.isAuthenticated).toBe(true);
    expect(result.payload).toBeUndefined();
    expect(result.error).toBeUndefined();
  });

  it('should handle expired tokens', async () => {
    const expiredToken = await signToken(payload, { secret, expiresIn: '0s' });
    const req = mockRequest({
      authorization: `Bearer ${expiredToken}`,
    });

    const result = await verifyRequest(req, { secret });

    expect(result.isAuthenticated).toBe(false);
    expect(result.payload).toBeUndefined();
    expect(result.error).toMatchObject({
      code: TokenErrorCode.EXPIRED,
      message: 'Token has expired',
    });
  });

  it('should handle invalid tokens', async () => {
    const req = mockRequest({
      authorization: 'Bearer invalid.token.here',
    });

    const result = await verifyRequest(req, { secret });

    expect(result.isAuthenticated).toBe(false);
    expect(result.payload).toBeUndefined();
    expect(result.error).toMatchObject({
      code: TokenErrorCode.MALFORMED,
      message: 'Malformed token',
    });
  });

  it('should support custom token extractors', async () => {
    const customExtractor = (
      req: IncomingMessage | { headers?: Record<string, string | string[] | undefined> },
    ) => {
      if (req instanceof IncomingMessage) {
        return req.headers['x-custom-token'] as string;
      }
      return req.headers?.['x-custom-token'] as string;
    };
    const req = mockRequest({
      'x-custom-token': token,
    });

    const result = await verifyRequest(req, {
      secret,
      extractors: [customExtractor],
    });

    expect(result.isAuthenticated).toBe(true);
    expect(result.payload).toMatchObject(payload);
    expect(result.error).toBeUndefined();
  });
});
