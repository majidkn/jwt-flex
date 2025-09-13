import { IncomingMessage } from 'http';
import { Socket } from 'net';
import {
  extractToken,
  fromAuthHeaderAsBearerToken,
  fromCookie,
  fromQueryParameter,
} from '../../src/core/extractors';

// Helper to create a proper IncomingMessage mock
function createMockRequest(options: {
  url?: string;
  headers?: Record<string, any>;
}): IncomingMessage {
  const socket = new Socket();
  const req = new IncomingMessage(socket);

  if (options.url) {
    req.url = options.url;
  }

  if (options.headers) {
    req.headers = options.headers;
  }

  return req;
}

describe('Token Extractors', () => {
  describe('fromQueryParameter', () => {
    it('should handle missing url', () => {
      const req = createMockRequest({
        headers: { host: 'example.com' },
      });

      const extractor = fromQueryParameter();
      expect(extractor(req)).toBeNull();
    });

    it('should handle missing host header', () => {
      const req = createMockRequest({
        headers: {},
      });

      const extractor = fromQueryParameter();
      expect(extractor(req)).toBeNull();
    });

    it('should handle custom parameter name', () => {
      const req = createMockRequest({
        url: '/path?access_token=123',
        headers: { host: 'example.com' },
      });

      const extractor = fromQueryParameter('access_token');
      expect(extractor(req)).toBe('123');
    });
  });

  describe('fromCookie', () => {
    it('should handle missing cookie header', () => {
      const req = createMockRequest({
        headers: {},
      });

      const extractor = fromCookie();
      expect(extractor(req)).toBeNull();
    });

    it('should handle malformed cookies', () => {
      const req = createMockRequest({
        headers: {
          cookie: 'malformed;cookie',
        },
      });

      const extractor = fromCookie();
      expect(extractor(req)).toBeNull();
    });

    it('should handle custom cookie name', () => {
      const req = createMockRequest({
        headers: {
          cookie: 'auth_token=xyz;other=123',
        },
      });

      const extractor = fromCookie('auth_token');
      expect(extractor(req)).toBe('xyz');
    });

    it('should handle multiple cookies', () => {
      const req = createMockRequest({
        headers: {
          cookie: 'session=abc; token=xyz; other=123',
        },
      });

      const extractor = fromCookie();
      expect(extractor(req)).toBe('xyz');
    });
  });

  describe('extractToken', () => {
    it('should try multiple extractors in order', () => {
      const req = createMockRequest({
        headers: {
          cookie: 'token=fromCookie',
          authorization: 'Bearer fromBearer',
          host: 'example.com',
        },
        url: '/path?token=fromQuery',
      });

      const token = extractToken(req, {
        extractors: [fromQueryParameter(), fromCookie(), fromAuthHeaderAsBearerToken()],
      });

      // Should use first successful extractor (query parameter)
      expect(token).toBe('fromQuery');
    });

    it('should use default bearer extractor when no extractors provided', () => {
      const req = createMockRequest({
        headers: {
          authorization: 'Bearer defaultBearer',
        },
      });

      const token = extractToken(req);
      expect(token).toBe('defaultBearer');
    });

    it('should return null when all extractors fail', () => {
      const req = createMockRequest({
        headers: {},
      });

      const token = extractToken(req, {
        extractors: [fromQueryParameter(), fromCookie(), fromAuthHeaderAsBearerToken()],
      });

      expect(token).toBeNull();
    });
  });
});
