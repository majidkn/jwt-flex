/**
 * HTTP Error class for handling authentication errors
 */
export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

// Express Request augmentation
declare global {
  namespace Express {
    interface Request {
      user?: unknown;
    }
  }
}

// Fastify Request augmentation
declare module 'fastify' {
  interface FastifyRequest {
    user?: unknown;
  }
}
