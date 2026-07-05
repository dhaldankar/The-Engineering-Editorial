export class TransientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class TerminalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class RateLimitError extends TransientError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message);
    this.name = this.constructor.name;
  }
}
