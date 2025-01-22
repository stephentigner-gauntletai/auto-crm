import { ApiResponse, PaginatedResponse, BaseQueryParams, ResourceMetadata } from './api';

/**
 * Ticket priority levels
 */
export enum TicketPriority {
	LOW = 'low',
	MEDIUM = 'medium',
	HIGH = 'high',
	URGENT = 'urgent',
}

/**
 * Ticket status values
 */
export enum TicketStatus {
	OPEN = 'open',
	IN_PROGRESS = 'in_progress',
	PENDING = 'pending',
	RESOLVED = 'resolved',
	CLOSED = 'closed',
}

/**
 * Base ticket interface
 */
export interface Ticket extends ResourceMetadata {
	id: string;
	title: string;
	description: string;
	status: TicketStatus;
	priority: TicketPriority;
	assigned_to?: string;
	team_id: string;
	customer_id?: string;
	tags?: string[];
	metadata?: Record<string, unknown>;
}

/**
 * Request body for creating a ticket
 */
export interface CreateTicketRequest {
	title: string;
	description: string;
	priority: TicketPriority;
	team_id: string;
	customer_id?: string;
	tags?: string[];
	metadata?: Record<string, unknown>;
}

/**
 * Request body for updating a ticket
 */
export interface UpdateTicketRequest {
	title?: string;
	description?: string;
	status?: TicketStatus;
	priority?: TicketPriority;
	assigned_to?: string;
	team_id?: string;
	tags?: string[];
	metadata?: Record<string, unknown>;
}

/**
 * Query parameters for listing tickets
 */
export interface ListTicketsParams extends BaseQueryParams {
	status?: TicketStatus;
	priority?: TicketPriority;
	team_id?: string;
	assigned_to?: string;
	customer_id?: string;
	tags?: string[];
	search?: string;
}

/**
 * Response for a single ticket
 */
export type TicketResponse = ApiResponse<Ticket>;

/**
 * Response for listing tickets
 */
export type ListTicketsResponse = PaginatedResponse<Ticket[]>;

/**
 * Ticket history entry type
 */
export interface TicketHistoryEntry extends ResourceMetadata {
	id: string;
	ticket_id: string;
	field: string;
	old_value: unknown;
	new_value: unknown;
	change_type: 'update' | 'status_change' | 'assignment' | 'priority_change';
}
