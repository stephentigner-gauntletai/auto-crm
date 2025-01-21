export class ApiError extends Error {
	constructor(
		public statusCode: number,
		message: string,
		public code?: string
	) {
		super(message);
		this.name = 'ApiError';
	}
}

export class ValidationError extends ApiError {
	constructor(message: string) {
		super(400, message, 'VALIDATION_ERROR');
		this.name = 'ValidationError';
	}
}

export class AuthenticationError extends ApiError {
	constructor(message = 'Unauthorized') {
		super(401, message, 'AUTHENTICATION_ERROR');
		this.name = 'AuthenticationError';
	}
}

export class ForbiddenError extends ApiError {
	constructor(message = 'Forbidden') {
		super(403, message, 'FORBIDDEN_ERROR');
		this.name = 'ForbiddenError';
	}
}

export class NotFoundError extends ApiError {
	constructor(message = 'Not Found') {
		super(404, message, 'NOT_FOUND_ERROR');
		this.name = 'NotFoundError';
	}
}
