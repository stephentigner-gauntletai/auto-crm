export class ApiError extends Error {
	constructor(
		message: string,
		public status: number,
		public code: string,
		public details?: unknown
	) {
		super(message);
		this.name = 'ApiError';
	}
}

export const ErrorCodes = {
	UNAUTHORIZED: 'UNAUTHORIZED',
	FORBIDDEN: 'FORBIDDEN',
	NOT_FOUND: 'NOT_FOUND',
	VALIDATION_ERROR: 'VALIDATION_ERROR',
	DATABASE_ERROR: 'DATABASE_ERROR',
	STORAGE_ERROR: 'STORAGE_ERROR',
	UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export interface ApiErrorResponse {
	error: {
		message: string;
		code: ErrorCode;
		details?: unknown;
	};
}

export function createErrorResponse(
	message: string,
	code: ErrorCode,
	status: number,
	details?: unknown
): Response {
	return new Response(
		JSON.stringify({
			error: {
				message,
				code,
				details,
			},
		}),
		{
			status,
			headers: {
				'Content-Type': 'application/json',
			},
		}
	);
}

export function handleDatabaseError(error: unknown): never {
	console.error('Database error:', error);
	throw new ApiError(
		'An error occurred while accessing the database',
		500,
		ErrorCodes.DATABASE_ERROR,
		error
	);
}

export function handleStorageError(error: unknown): never {
	console.error('Storage error:', error);
	throw new ApiError(
		'An error occurred while accessing storage',
		500,
		ErrorCodes.STORAGE_ERROR,
		error
	);
}

export function handleValidationError(message: string, details?: unknown): never {
	throw new ApiError(message, 400, ErrorCodes.VALIDATION_ERROR, details);
}

export function isApiError(error: unknown): error is ApiError {
	return error instanceof ApiError;
}
