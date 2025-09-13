import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { InvalidTokenError, MalformedTokenError, TokenExpiredError } from '../core/errors';
import { extractToken } from '../core/extractors';
import { verifyToken } from '../core/token';
import { HttpError } from '../types/http';
import { FastifyJwtOptions } from '../types/middleware';

export type { FastifyJwtOptions };

async function jwtPlugin<T extends object>(fastify: FastifyInstance, options: FastifyJwtOptions) {
  const { credentialsRequired = true, ...tokenOptions } = options;

  fastify.decorateRequest('user', null);

  fastify.addHook('onRequest', async (request: FastifyRequest, _reply: FastifyReply) => {
    try {
      const token = extractToken(request.raw, options);

      if (!token) {
        if (credentialsRequired) {
          throw new HttpError(401, 'No authorization token was found');
        }
        return;
      }

      const payload = await verifyToken<T>(token, tokenOptions);
      request.user = payload;
    } catch (error) {
      const errorMap = {
        [TokenExpiredError.name]: { code: 'TOKEN_EXPIRED', message: 'Token has expired' },
        [InvalidTokenError.name]: { code: 'TOKEN_INVALID', message: 'Invalid token signature' },
        [MalformedTokenError.name]: { code: 'TOKEN_MALFORMED', message: 'Malformed token' },
      };

      if (error instanceof Error && error.constructor.name in errorMap) {
        throw new HttpError(401, errorMap[error.constructor.name].message);
      }

      throw error;
    }
  });
}

export const fastifyPlugin = fp(jwtPlugin, {
  name: 'fastify-jwt-auth',
  fastify: '4.x',
});
