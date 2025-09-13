import { FastifyInstance } from 'fastify';
import { signToken } from '../../src/core/token';
import { fastifyPlugin } from '../../src/middleware/fastify';

describe('Fastify Plugin', () => {
  const secret = 'test-secret';
  const payload = { userId: 1, role: 'admin' };
  let token: string;
  let app: FastifyInstance;
  let mockRequest: any;
  let mockReply: any;

  beforeEach(async () => {
    token = await signToken(payload, { secret });
    mockRequest = {
      headers: {},
      raw: { headers: {} },
    };
    mockReply = {
      code: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    app = {
      addHook: jest.fn(),
      decorateRequest: jest.fn(),
      httpErrors: {
        unauthorized: (msg: string) => {
          const error = new Error(msg);
          error.name = 'UnauthorizedError';
          return error;
        },
      },
    } as unknown as FastifyInstance;
  });

  it('should authenticate valid tokens', async () => {
    mockRequest.headers.authorization = `Bearer ${token}`;
    mockRequest.raw.headers.authorization = `Bearer ${token}`;

    await fastifyPlugin(app, { secret });

    const onRequestHook = (app.addHook as jest.Mock).mock.calls[0][1];
    await onRequestHook(mockRequest, mockReply);

    expect(mockRequest.user).toMatchObject(payload);
  });

  it('should reject requests without token when required', async () => {
    await fastifyPlugin(app, { secret });

    const onRequestHook = (app.addHook as jest.Mock).mock.calls[0][1];
    await expect(onRequestHook(mockRequest, mockReply)).rejects.toThrow(
      'No authorization token was found',
    );
  });

  it('should allow requests without token when not required', async () => {
    await fastifyPlugin(app, { secret, credentialsRequired: false });

    const onRequestHook = (app.addHook as jest.Mock).mock.calls[0][1];
    await onRequestHook(mockRequest, mockReply);

    expect(mockRequest.user).toBeUndefined();
  });

  it('should reject expired tokens', async () => {
    const expiredToken = await signToken(payload, { secret, expiresIn: '0s' });
    mockRequest.headers.authorization = `Bearer ${expiredToken}`;
    mockRequest.raw.headers.authorization = `Bearer ${expiredToken}`;

    await fastifyPlugin(app, { secret });

    const onRequestHook = (app.addHook as jest.Mock).mock.calls[0][1];
    await expect(onRequestHook(mockRequest, mockReply)).rejects.toThrow('Token has expired');
  });

  it('should support custom token extractors', async () => {
    const customExtractor = (req: any) => req.headers['x-custom-token'];
    mockRequest.headers['x-custom-token'] = token;
    mockRequest.raw.headers['x-custom-token'] = token;

    await fastifyPlugin(app, { secret, extractors: [customExtractor] });

    const onRequestHook = (app.addHook as jest.Mock).mock.calls[0][1];
    await onRequestHook(mockRequest, mockReply);

    expect(mockRequest.user).toMatchObject(payload);
  });

  it('should reject invalid token signatures', async () => {
    const invalidToken = token.slice(0, -1) + (token[token.length - 1] === '0' ? '1' : '0');
    mockRequest.headers.authorization = `Bearer ${invalidToken}`;
    mockRequest.raw.headers.authorization = `Bearer ${invalidToken}`;

    await fastifyPlugin(app, { secret });

    const onRequestHook = (app.addHook as jest.Mock).mock.calls[0][1];
    await expect(onRequestHook(mockRequest, mockReply)).rejects.toThrow('Invalid token signature');
  });

  it('should reject malformed tokens', async () => {
    const malformedToken = 'not.a.validtoken';
    mockRequest.headers.authorization = `Bearer ${malformedToken}`;
    mockRequest.raw.headers.authorization = `Bearer ${malformedToken}`;

    await fastifyPlugin(app, { secret });

    const onRequestHook = (app.addHook as jest.Mock).mock.calls[0][1];
    await expect(onRequestHook(mockRequest, mockReply)).rejects.toThrow('Malformed token');
  });

  it('should try multiple token extractors in order', async () => {
    const customExtractor1 = () => null;
    const customExtractor2 = (req: any) => req.headers['x-custom-token'];
    mockRequest.headers['x-custom-token'] = token;
    mockRequest.raw.headers['x-custom-token'] = token;

    await fastifyPlugin(app, { secret, extractors: [customExtractor1, customExtractor2] });

    const onRequestHook = (app.addHook as jest.Mock).mock.calls[0][1];
    await onRequestHook(mockRequest, mockReply);

    expect(mockRequest.user).toMatchObject(payload);
  });

  it('should decorate request with user property', async () => {
    await fastifyPlugin(app, { secret });

    expect(app.decorateRequest).toHaveBeenCalledWith('user', null);
  });
});
