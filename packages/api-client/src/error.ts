export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isNetworkError() {
    return this.status === 0;
  }

  /** Used to render the spec's "ChiruDeli is currently available in Chirundu…" message. */
  get isOutsideServiceArea() {
    return this.code === 'OUTSIDE_SERVICE_AREA';
  }
}
