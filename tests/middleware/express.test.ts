import { Request, Response } from 'express';
import { signToken } from '../../src/core/token';
import { expressMiddleware } from '../../src/middleware/express';

describe('Express Middleware', () => {
  const secret = 'test-secret';
  const payload = { userId: 1, role: 'admin' };
  let token: string;

  beforeEach(async () => {
    token = await signToken(payload, { secret });
  });

  const mockRequest = (headers = {}): Partial<Request> => ({
    headers: headers,
  });

  const mockResponse = (): Partial<Response> => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  const mockNext = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should authenticate valid tokens', async () => {
    const req = mockRequest({ authorization: `Bearer ${token}` });
    const res = mockResponse();
    const middleware = expressMiddleware({ secret });

    await middleware(req as Request, res as Response, mockNext);

    expect(req.user).toMatchObject(payload);
    expect(mockNext).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should reject requests without token when required', async () => {
    const req = mockRequest();
    const res = mockResponse();
    const middleware = expressMiddleware({ secret });

    await middleware(req as Request, res as Response, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'No authorization token was found',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should allow requests without token when not required', async () => {
    const req = mockRequest();
    const res = mockResponse();
    const middleware = expressMiddleware({ secret, credentialsRequired: false });

    await middleware(req as Request, res as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should reject expired tokens', async () => {
    const expiredToken = await signToken(payload, { secret, expiresIn: '0s' });
    const req = mockRequest({ authorization: `Bearer ${expiredToken}` });
    const res = mockResponse();
    const middleware = expressMiddleware({ secret });

    await middleware(req as Request, res as Response, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Token has expired',
    });
  });

  it('should support custom token extractors', async () => {
    const customExtractor = (
      req: Request | { headers?: Record<string, string | string[] | undefined> },
    ) => {
      if ('headers' in req) {
        return req.headers?.['x-custom-token'] as string;
      }
      return null;
    };
    const req = mockRequest({ 'x-custom-token': token });
    const res = mockResponse();
    const middleware = expressMiddleware({ secret, extractors: [customExtractor] });

    await middleware(req as Request, res as Response, mockNext);

    expect(req.user).toMatchObject(payload);
    expect(mockNext).toHaveBeenCalled();
  });
});
