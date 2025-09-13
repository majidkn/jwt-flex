export class TokenExpiredError extends Error {
  constructor() {
    super('Token has expired');
    this.name = 'TokenExpiredError';
  }
}

export class InvalidTokenError extends Error {
  constructor() {
    super('Invalid token signature');
    this.name = 'InvalidTokenError';
  }
}

export class MalformedTokenError extends Error {
  constructor() {
    super('Malformed token');
    this.name = 'MalformedTokenError';
  }
}

export class NoTokenError extends Error {
  constructor() {
    super('No authorization token was found');
    this.name = 'NoTokenError';
  }
}
