/**
 * Base API response type that all responses extend
 */
export interface ApiResponse<T> {
	data?: T;
	error?: {
		code: string;
		message: string;
	};
}

/**
 * Response type for paginated endpoints
 */
export interface PaginatedResponse<T> extends ApiResponse<T> {
	pagination: {
		page: number;
		pageSize: number;
		total: number;
	};
}

/**
 * Common status codes used across the API
 */
export enum ApiStatusCode {
	OK = 200,
	CREATED = 201,
	BAD_REQUEST = 400,
	UNAUTHORIZED = 401,
	FORBIDDEN = 403,
	NOT_FOUND = 404,
	INTERNAL_ERROR = 500,
}

/**
 * Common error codes used across the API
 */
export enum ApiErrorCode {
	VALIDATION_ERROR = 'VALIDATION_ERROR',
	AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
	AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
	NOT_FOUND = 'NOT_FOUND',
	INTERNAL_ERROR = 'INTERNAL_ERROR',
	CONFLICT = 'CONFLICT',
}

/**
 * Base error type for API errors
 */
export interface ApiError {
	code: ApiErrorCode;
	message: string;
	details?: Record<string, unknown>;
}

/**
 * Base query parameters interface that all list endpoints extend
 */
export interface BaseQueryParams {
	page?: number;
	pageSize?: number;
	sortBy?: string;
	sortOrder?: 'asc' | 'desc';
}

/**
 * Base metadata interface for all resources
 */
export interface ResourceMetadata {
	created_at: string;
	updated_at: string;
	created_by: string;
	updated_by?: string;
	version: number;
}
