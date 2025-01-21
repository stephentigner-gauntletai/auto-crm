import { NextResponse } from 'next/server';
import { ApiError } from './errors';

export interface ApiResponse<T> {
	data?: T;
	error?: {
		code: string;
		message: string;
	};
	pagination?: {
		page: number;
		pageSize: number;
		total: number;
	};
}

export function successResponse<T>(
	data: T,
	pagination?: ApiResponse<T>['pagination']
): NextResponse<ApiResponse<T>> {
	return NextResponse.json({
		data,
		...(pagination && { pagination }),
	});
}

export function errorResponse(error: Error | ApiError): NextResponse<ApiResponse<never>> {
	if (error instanceof ApiError) {
		return NextResponse.json(
			{
				error: {
					code: error.code || 'INTERNAL_SERVER_ERROR',
					message: error.message,
				},
			},
			{ status: error.statusCode }
		);
	}

	// Default to 500 for unknown errors
	return NextResponse.json(
		{
			error: {
				code: 'INTERNAL_SERVER_ERROR',
				message: 'An unexpected error occurred',
			},
		},
		{ status: 500 }
	);
}

export function paginatedResponse<T>(
	data: T[],
	page: number,
	pageSize: number,
	total: number
): NextResponse<ApiResponse<T[]>> {
	return successResponse(data, {
		page,
		pageSize,
		total,
	});
}
