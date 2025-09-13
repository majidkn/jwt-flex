import { ExecutionContext } from '@nestjs/common';
import { signToken } from '../../src/core/token';
import { JwtAuthGuard, UseJwtAuth } from '../../src/middleware/nest';

describe('NestJS Guard', () => {
  const secret = 'test-secret';
  const payload = { userId: 1, role: 'admin' };
  let token: string;
  let guard: JwtAuthGuard<typeof payload>;

  beforeEach(async () => {
    token = await signToken(payload, { secret });
    guard = new JwtAuthGuard({ secret });
  });

  const mockExecutionContext = (headers = {}): ExecutionContext => {
    const request = {
      headers,
      user: undefined,
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => ({}),
        getNext: () => () => {},
      }),
      getClass: () => class {},
      getHandler: () => function () {},
      getArgs: () => [],
      getArgByIndex: () => null,
      switchToRpc: () => ({
        getContext: () => ({}),
        getData: () => ({}),
      }),
      switchToWs: () => ({
        getClient: () => ({}),
        getData: () => ({}),
      }),
      getType: () => 'http',
    } as unknown as ExecutionContext;
  };

  it('should allow requests with valid tokens', async () => {
    const context = mockExecutionContext({
      authorization: `Bearer ${token}`,
    });

    const result = await guard.canActivate(context);
    const request = context.switchToHttp().getRequest();

    expect(result).toBe(true);
    expect(request.user).toMatchObject(payload);
  });

  it('should reject requests without token when required', async () => {
    const context = mockExecutionContext({});

    await expect(guard.canActivate(context)).rejects.toThrow('No authorization token was found');
  });

  it('should allow requests without token when not required', async () => {
    const optionalGuard = new JwtAuthGuard({ secret, credentialsRequired: false });
    const context = mockExecutionContext({});

    const result = await optionalGuard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should reject expired tokens', async () => {
    const expiredToken = await signToken(payload, { secret, expiresIn: '0s' });
    const context = mockExecutionContext({
      authorization: `Bearer ${expiredToken}`,
    });

    await expect(guard.canActivate(context)).rejects.toThrow('Token has expired');
  });

  it('should support custom token extractors', async () => {
    const customExtractor = (req: any) => req.headers['x-custom-token'];
    const guardWithCustomExtractor = new JwtAuthGuard({
      secret,
      extractors: [customExtractor],
    });

    const context = mockExecutionContext({
      'x-custom-token': token,
    });

    const result = await guardWithCustomExtractor.canActivate(context);
    const request = context.switchToHttp().getRequest();

    expect(result).toBe(true);
    expect(request.user).toMatchObject(payload);
  });

  describe('UseJwtAuth decorator', () => {
    it('should work as a method decorator', async () => {
      class TestController {
        @UseJwtAuth({ secret })
        async testMethod(context: ExecutionContext) {
          const request = context.switchToHttp().getRequest();
          expect(request.user).toMatchObject(payload);
          return 'success';
        }
      }

      const controller = new TestController();
      const context = mockExecutionContext({
        authorization: `Bearer ${token}`,
      });

      const result = await controller.testMethod(context);
      expect(result).toBe('success');
    });

    it('should work as a class decorator', async () => {
      @UseJwtAuth({ secret })
      class TestController {
        async testMethod(context: ExecutionContext) {
          const request = context.switchToHttp().getRequest();
          expect(request.user).toMatchObject(payload);
          return 'success';
        }
      }

      const controller = new TestController();
      const context = mockExecutionContext({
        authorization: `Bearer ${token}`,
      });

      const result = await controller.testMethod(context);
      expect(result).toBe('success');
    });
  });
});
