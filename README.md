# JWT Flex

A flexible JWT authentication library for Node.js with support for Express, Fastify, NestJS, and pure Node.js applications.

> **Note**: This package is in pre-1.0 development. The API may change before the 1.0.0 release.

## Features

- 🔒 Secure JWT token generation and verification
- 🔄 Support for multiple frameworks:
  - Express middleware
  - Fastify plugin
  - NestJS guard
  - Pure Node.js request verifier
- 🎯 TypeScript support with generic payload types
- 🔌 Customizable token extractors
- ⚡ ESM and CommonJS support
- 🧪 Comprehensive test coverage

## Installation

```bash
# Using npm
npm install jwt-flex

# Using yarn
yarn add jwt-flex

# Using pnpm
pnpm add jwt-flex

# Using bun
bun add jwt-flex
```

## Package Size

The library is highly optimized for size with code splitting and separate bundles for each framework:

Framework-specific entry points (additional functionality loaded on demand):

- Core functionality: 0.33 KB
- Express middleware: 0.42 KB
- Fastify plugin: 2.20 KB
- NestJS guard: 0.80 KB
- Node.js utilities: 0.74 KB

Shared core bundles (loaded once and shared):

- Core utilities: 59.80 KB
- Shared helpers: 0.11 KB

## Usage

Each framework integration is available as a separate import to keep bundle sizes minimal:

```typescript
// Core JWT functionality
import { signToken, verifyToken } from 'jwt-flex';

// Framework-specific imports
import { expressMiddleware } from 'jwt-flex/express';
import { fastifyPlugin } from 'jwt-flex/fastify';
import { JwtAuthGuard, UseJwtAuth } from 'jwt-flex/nest';
import { verifyRequest } from 'jwt-flex/node';
```

### Core Functions

```typescript
import { signToken, verifyToken } from 'jwt-flex';

// Sign a token
const payload = { userId: 1, role: 'admin' };
const token = await signToken(payload, {
  secret: 'your-secret',
  expiresIn: '1h',
  algorithm: 'HS256', // optional, defaults to HS256
});

// Verify a token
const decoded = await verifyToken(token, {
  secret: 'your-secret',
  algorithms: ['HS256'], // optional
});
```

### Express Middleware

```typescript
import { expressMiddleware } from 'jwt-flex/express';

app.use(
  expressMiddleware({
    secret: 'your-secret',
    credentialsRequired: true, // optional, defaults to true
  }),
);

// Access the decoded payload in your route handlers
app.get('/protected', (req, res) => {
  console.log(req.user); // decoded token payload
  res.json({ message: 'Protected route' });
});
```

### Fastify Plugin

```typescript
import { fastifyPlugin } from 'jwt-flex/fastify';

await app.register(fastifyPlugin, {
  secret: 'your-secret',
  credentialsRequired: true, // optional, defaults to true
});

// Access the decoded payload in your route handlers
app.get('/protected', async (request, reply) => {
  console.log(request.user); // decoded token payload
  return { message: 'Protected route' };
});
```

### NestJS Guard

```typescript
import { JwtAuthGuard, UseJwtAuth } from 'jwt-flex/nest';

// Use as a guard
@UseGuards(new JwtAuthGuard({ secret: 'your-secret' }))
export class ProtectedController {
  @Get()
  getProtectedResource() {
    return 'Protected resource';
  }
}

// Or use as a decorator
@UseJwtAuth({ secret: 'your-secret' })
export class ProtectedController {
  @Get()
  getProtectedResource() {
    return 'Protected resource';
  }
}
```

### Pure Node.js

```typescript
import { verifyRequest } from 'jwt-flex/node';
import { createServer } from 'http';

const server = createServer(async (req, res) => {
  const result = await verifyRequest(req, {
    secret: 'your-secret',
    credentialsRequired: true, // optional, defaults to true
  });

  if (!result.isAuthenticated) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: result.error }));
    return;
  }

  // Access the decoded payload
  console.log(result.payload);
  res.end('Protected resource');
});
```

### Token Extractors

The library provides several built-in token extractors and supports custom extractors:

#### Built-in Extractors

1. **Bearer Token Extractor**

```typescript
import { fromAuthHeaderAsBearerToken } from 'jwt-flex';

app.use(
  expressMiddleware({
    secret: 'your-secret',
    extractors: [fromAuthHeaderAsBearerToken()],
  }),
);
```

2. **Query Parameter Extractor**

```typescript
import { fromQueryParameter } from 'jwt-flex';

app.use(
  expressMiddleware({
    secret: 'your-secret',
    extractors: [fromQueryParameter('access_token')],
  }),
);
```

3. **Cookie Extractor**

```typescript
import { fromCookie } from 'jwt-flex';

app.use(
  expressMiddleware({
    secret: 'your-secret',
    extractors: [fromCookie('auth_token')],
  }),
);
```

#### Custom Extractors

You can create your own token extractors by implementing the `TokenExtractor` interface:

```typescript
import { TokenExtractor } from 'jwt-flex';

// Create a custom token extractor
const customExtractor: TokenExtractor = (req) => {
  // Extract token from custom source
  return req.headers['x-custom-token'] || null;
};

// Use the custom extractor
app.use(
  expressMiddleware({
    secret: 'your-secret',
    extractors: [customExtractor],
  }),
);
```

#### Multiple Extractors

You can use multiple extractors with fallback:

```typescript
app.use(
  expressMiddleware({
    secret: 'your-secret',
    extractors: [
      fromAuthHeaderAsBearerToken(),
      fromCookie('auth_token'),
      fromQueryParameter('access_token'),
      customExtractor,
    ],
  }),
);
```

The extractors are tried in order until a token is found.

## API Reference

### Core

#### `signToken<T>(payload: T, options: JwtOptions): Promise<string>`

Signs a payload and returns a JWT token.

Options:

- `secret: string` - Secret key for signing
- `expiresIn?: string | number` - Token expiration time
- `algorithm?: string` - Signing algorithm (default: 'HS256')

#### `verifyToken<T>(token: string, options: VerifyOptions): Promise<T>`

Verifies a token and returns the decoded payload.

Options:

- `secret: string` - Secret key for verification
- `algorithms?: string[]` - Allowed algorithms (default: ['HS256'])

### Middleware Options

All middleware adapters (Express, Fastify, NestJS, Node.js) accept these options:

- `secret: string` - Secret key for token verification
- `credentialsRequired?: boolean` - Whether to require authentication (default: true)
- `extractors?: TokenExtractor[]` - Custom token extractors
- `algorithms?: string[]` - Allowed algorithms (default: ['HS256'])

## Error Handling

The library provides specific error classes for better error handling:

### Error Types

- `TokenExpiredError` - Thrown when the token has expired
- `InvalidTokenError` - Thrown when the token signature is invalid
- `MalformedTokenError` - Thrown when the token format is invalid
- `HttpError` - Used in Fastify middleware for HTTP-specific errors (includes status code)

### Error Handling Example

```typescript
import { verifyToken, TokenExpiredError, InvalidTokenError, MalformedTokenError } from 'jwt-flex';

try {
  const decoded = await verifyToken(token, { secret: 'your-secret' });
  // Token is valid, use decoded payload
} catch (error) {
  if (error instanceof TokenExpiredError) {
    console.error('Token has expired');
    // Handle expired token
  } else if (error instanceof InvalidTokenError) {
    console.error('Invalid token signature');
    // Handle invalid signature
  } else if (error instanceof MalformedTokenError) {
    console.error('Malformed token');
    // Handle malformed token
  } else {
    console.error('Unknown error:', error);
    // Handle other errors
  }
}
```

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)

### Setup

1. Clone the repository

```bash
git clone https://github.com/majidkn/jwt-flex.git
cd jwt-flex
```

2. Install dependencies

```bash
bun install
```

### Scripts

- `bun run build` - Build everything (JS bundles + TypeScript declarations)
- `bun run build:js` - Build and optimize JS bundles only
- `bun run build:types` - Generate TypeScript declarations only
- `bun run test` - Run tests
- `bun run lint` - Run ESLint
- `bun run format` - Format code with Prettier
- `bun run format:check` - Check code formatting
- `bun run clean` - Clean build directory

### Building

The project uses Bun's build system with advanced optimizations:

```bash
# Clean and build everything
bun run build

# Individual build steps
bun run build:js    # Build and optimize JS bundles
bun run build:types # Generate TypeScript declarations
```

The build process:

1. Uses code splitting to share common code
2. Minifies and optimizes each bundle
3. Generates separate entry points for each framework
4. Creates TypeScript declaration files
5. Supports both ESM and CommonJS formats

Output bundles:

- Framework entry points (0.33 KB - 2.12 KB each)
- Shared core bundle (59.71 KB, loaded once)
- TypeScript declarations for all modules

The project uses a single TypeScript configuration for both development and production builds, making it easier to maintain and extend.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Requirements

- [Bun](https://bun.sh/) (latest version) - Used for development tasks (building, testing, linting)
- [ESLint](https://eslint.org/) - For code linting (installed via bun)
- [Prettier](https://prettier.io/) - For code formatting (installed via bun)

Before submitting a PR:

1. Make sure all tests pass: `bun run test`
2. Run the linter: `bun run lint`
3. Check code formatting: `bun run format:check`
4. Build the project: `bun run build`

## License

MIT
