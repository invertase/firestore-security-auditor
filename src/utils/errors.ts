/**
 * Base error class for all application errors
 */
export class FirestoreAuditorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Thrown when a resource is not found
 */
export class NotFoundError extends FirestoreAuditorError {
  resourceType: string;
  resourceId: string;

  constructor(resourceType: string, resourceId: string) {
    super(`${resourceType} not found: ${resourceId}`);
    this.resourceType = resourceType;
    this.resourceId = resourceId;
  }
}

/**
 * Thrown when there's an internal error in the application
 */
export class InternalError extends FirestoreAuditorError {
  constructor(message: string) {
    super(`Internal Error: ${message}`);
  }
}
