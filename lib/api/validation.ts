import { ValidationError } from './errors';

export interface ValidatableObject {
	[key: string]: unknown;
}

export function validateRequired(data: ValidatableObject, fields: string[]): void {
	const missing = fields.filter((field) => !data[field]);
	if (missing.length > 0) {
		throw new ValidationError(`Missing required fields: ${missing.join(', ')}`);
	}
}

export function validateEnum<T extends string>(
	value: unknown,
	enumValues: readonly T[],
	fieldName: string
): void {
	if (!enumValues.includes(value as T)) {
		throw new ValidationError(`Invalid ${fieldName}. Must be one of: ${enumValues.join(', ')}`);
	}
}

export function validateUUID(value: string, fieldName: string): void {
	const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
	if (!uuidRegex.test(value)) {
		throw new ValidationError(`Invalid ${fieldName}. Must be a valid UUID`);
	}
}

export function validateEmail(email: string): void {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailRegex.test(email)) {
		throw new ValidationError('Invalid email address');
	}
}

export function validateLength(value: string, fieldName: string, min?: number, max?: number): void {
	if (min !== undefined && value.length < min) {
		throw new ValidationError(`${fieldName} must be at least ${min} characters long`);
	}
	if (max !== undefined && value.length > max) {
		throw new ValidationError(`${fieldName} must be no more than ${max} characters long`);
	}
}
