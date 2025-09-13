# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2024-03-13

### Added

- Added repository, bugs, and homepage fields to package.json for better GitHub integration

## [0.1.0] - 2024-03-13

### Added

- Initial release of JWT Flex
- Core JWT functionality with `signToken` and `verifyToken`
- Framework integrations:
  - Express middleware
  - Fastify plugin
  - NestJS guard
  - Pure Node.js request verifier
- Built-in token extractors:
  - Bearer token from Authorization header
  - Query parameter
  - Cookie
- TypeScript support with generic payload types
- Comprehensive test coverage
- ESM and CommonJS support
- Code splitting for optimized bundle sizes

### Security

- Secure JWT token generation and verification
- Configurable token extraction strategies
- Support for multiple signing algorithms

[0.1.1]: https://github.com/majidkn/jwt-flex/releases/tag/v0.1.1
[0.1.0]: https://github.com/majidkn/jwt-flex/releases/tag/v0.1.0
