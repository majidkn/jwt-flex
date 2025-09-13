import { NextFunction, Request, Response } from 'express';
import { NoTokenError } from '../core/errors';
import { extractToken } from '../core/extractors';
import { verifyToken } from '../core/token';
import '../types/http';
import { ExpressJwtOptions } from '../types/middleware';

export type { ExpressJwtOptions };

export const expressMiddleware = <T extends object>(options: ExpressJwtOptions) => {
  const { credentialsRequired = true, ...tokenOptions } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = extractToken(req, options);

      if (!token && credentialsRequired) {
        return res.status(401).json({ error: new NoTokenError().message });
      }

      if (!token) {
        return next();
      }

      const payload = await verifyToken<T>(token, tokenOptions);
      req.user = payload;
      next();
    } catch (error) {
      if (error instanceof Error) {
        return res.status(401).json({ error: error.message });
      }
      next(error);
    }
  };
};
