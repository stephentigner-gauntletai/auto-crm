import { ApiResponse, ApiError } from './api';
import { TicketStatus, TicketPriority, Ticket } from './tickets';
import { UserRole, User } from './auth';
import { TeamRole, Team } from './teams';

/**
 * Type guard for checking if a value is a valid ticket status
 */
export function isTicketStatus(value: unknown): value is TicketStatus {
	return typeof value === 'string' && Object.values(TicketStatus).includes(value as TicketStatus);
}

/**
 * Type guard for checking if a value is a valid ticket priority
 */
export function isTicketPriority(value: unknown): value is TicketPriority {
	return (
		typeof value === 'string' && Object.values(TicketPriority).includes(value as TicketPriority)
	);
}

/**
 * Type guard for checking if a value is a valid user role
 */
export function isUserRole(value: unknown): value is UserRole {
	return typeof value === 'string' && Object.values(UserRole).includes(value as UserRole);
}

/**
 * Type guard for checking if a value is a valid team role
 */
export function isTeamRole(value: unknown): value is TeamRole {
	return typeof value === 'string' && Object.values(TeamRole).includes(value as TeamRole);
}

/**
 * Type guard for checking if a response is an error
 */
export function isApiError<T>(response: ApiResponse<T>): response is ApiResponse<T> & {
	error: ApiError;
} {
	return response.error !== undefined;
}

/**
 * Type guard for checking if an object is a valid ticket
 */
export function isTicket(value: unknown): value is Ticket {
	if (!value || typeof value !== 'object') return false;

	const ticket = value as Partial<Ticket>;
	return (
		typeof ticket.id === 'string' &&
		typeof ticket.title === 'string' &&
		typeof ticket.description === 'string' &&
		isTicketStatus(ticket.status) &&
		isTicketPriority(ticket.priority) &&
		typeof ticket.team_id === 'string'
	);
}

/**
 * Type guard for checking if an object is a valid user
 */
export function isUser(value: unknown): value is User {
	if (!value || typeof value !== 'object') return false;

	const user = value as Partial<User>;
	return (
		typeof user.id === 'string' &&
		typeof user.email === 'string' &&
		typeof user.full_name === 'string' &&
		isUserRole(user.role) &&
		typeof user.is_active === 'boolean'
	);
}

/**
 * Type guard for checking if an object is a valid team
 */
export function isTeam(value: unknown): value is Team {
	if (!value || typeof value !== 'object') return false;

	const team = value as Partial<Team>;
	return (
		typeof team.id === 'string' && typeof team.name === 'string' && Array.isArray(team.members)
	);
}

/**
 * Utility type for making all properties of T required and non-nullable
 */
export type Required<T> = {
	[P in keyof T]-?: NonNullable<T[P]>;
};

/**
 * Utility type for making all properties of T optional
 */
export type Optional<T> = {
	[P in keyof T]?: T[P];
};

/**
 * Utility type for picking only the specified properties from T
 */
export type PickRequired<T, K extends keyof T> = Required<Pick<T, K>>;

/**
 * Utility type for omitting the specified properties from T
 */
export type OmitOptional<T, K extends keyof T> = Optional<Omit<T, K>>;
