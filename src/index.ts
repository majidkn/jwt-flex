// Core exports
export * from './core/errors';
export * from './core/extractors';
export * from './core/token';
export * from './core/types';

// Express middleware exports
export { ExpressJwtOptions, expressMiddleware } from './middleware/express';

// Fastify plugin exports
export { FastifyJwtOptions, fastifyPlugin } from './middleware/fastify';

// NestJS guard exports
export { JwtAuthGuard, NestJwtOptions, UseJwtAuth } from './middleware/nest';

// Node.js verifier exports
export { NodeJwtOptions, VerifyRequestResult, verifyRequest } from './middleware/node';
