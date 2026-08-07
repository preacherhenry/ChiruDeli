/**
 * Domain errors carry a stable `code` string that survives the HTTP
 * boundary — the api-client's ApiError exposes the same code so screens can
 * branch on it (e.g. `error.isOutsideServiceArea`) instead of parsing text.
 */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(entity: string) {
    super(404, 'NOT_FOUND', `${entity} not found.`);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required.') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You don't have permission to do that.") {
    super(403, 'FORBIDDEN', message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code = 'CONFLICT') {
    super(409, code, message);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(422, 'VALIDATION_ERROR', message, details);
  }
}

export class OutsideServiceAreaError extends AppError {
  constructor() {
    super(
      422,
      'OUTSIDE_SERVICE_AREA',
      "ChiruDeli is currently available in Chirundu. We're working on expanding to more areas.",
    );
  }
}

export class InvalidStatusTransitionError extends AppError {
  constructor(from: string, to: string) {
    super(409, 'INVALID_STATUS_TRANSITION', `Cannot move an order from ${from} to ${to}.`);
  }
}
