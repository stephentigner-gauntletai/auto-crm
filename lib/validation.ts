import { handleValidationError } from './errors';

interface ValidationRule<T> {
	validate: (value: T) => boolean;
	message: string;
}

export function validateRequired<T>(value: T | null | undefined, fieldName: string): T {
	if (value === null || value === undefined || value === '') {
		handleValidationError(`${fieldName} is required`);
	}
	return value as T;
}

export function validateString(value: unknown, fieldName: string): string {
	if (typeof value !== 'string') {
		handleValidationError(`${fieldName} must be a string`);
	}
	return value as string;
}

export function validateNumber(value: unknown, fieldName: string): number {
	if (typeof value !== 'number' || isNaN(value)) {
		handleValidationError(`${fieldName} must be a number`);
	}
	return value as number;
}

export function validateEnum<T extends string>(
	value: unknown,
	allowedValues: readonly T[],
	fieldName: string
): T {
	if (typeof value !== 'string' || !allowedValues.includes(value as T)) {
		handleValidationError(`${fieldName} must be one of: ${allowedValues.join(', ')}`);
	}
	return value as T;
}

export function validateLength(value: string, min: number, max: number, fieldName: string): string {
	if (value.length < min || value.length > max) {
		handleValidationError(`${fieldName} must be between ${min} and ${max} characters`);
	}
	return value;
}

export function validateCustom<T>(value: T, rules: ValidationRule<T>[]): T {
	for (const rule of rules) {
		if (!rule.validate(value)) {
			handleValidationError(rule.message);
		}
	}
	return value;
}

// Business rule validations
export const TicketRules = {
	title: {
		minLength: 3,
		maxLength: 100,
	},
	description: {
		minLength: 10,
		maxLength: 2000,
	},
	status: ['new', 'open', 'in_progress', 'resolved', 'closed'] as const,
	priority: ['low', 'medium', 'high', 'urgent'] as const,
} as const;

export function validateTicketData(data: unknown): {
	title: string;
	description: string;
	status: (typeof TicketRules.status)[number];
	priority: (typeof TicketRules.priority)[number];
} {
	if (typeof data !== 'object' || data === null) {
		handleValidationError('Invalid ticket data');
	}

	const ticket = data as Record<string, unknown>;

	const title = validateString(ticket.title, 'Title');
	validateLength(title, TicketRules.title.minLength, TicketRules.title.maxLength, 'Title');

	const description = validateString(ticket.description, 'Description');
	validateLength(
		description,
		TicketRules.description.minLength,
		TicketRules.description.maxLength,
		'Description'
	);

	const status = validateEnum(ticket.status ?? 'new', TicketRules.status, 'Status');
	const priority = validateEnum(ticket.priority ?? 'medium', TicketRules.priority, 'Priority');

	return {
		title,
		description,
		status,
		priority,
	};
}
