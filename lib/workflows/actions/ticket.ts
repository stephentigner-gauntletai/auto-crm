import {
	TicketStatus,
	TicketPriority,
	type Ticket,
	type UpdateTicketRequest,
} from '@/types/tickets';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/types/supabase';

type HistoryDetails = {
	old?: string | null;
	new?: string | null;
	field?: string;
	updates?: Record<string, string | null>;
};

/**
 * Core ticket update operations that can be used by both the workflow engine
 * and other server-side components
 */
export const ticketOperations = {
	/**
	 * Update a single field of a ticket
	 */
	async updateField(ticketId: string, field: string, value: unknown) {
		const supabase = createClient();
		const { data, error } = await supabase
			.from('tickets')
			.update({ [field]: value })
			.eq('id', ticketId)
			.select()
			.single();

		if (error) {
			throw new Error(error.message || `Failed to update ticket ${field}`);
		}

		return data;
	},

	/**
	 * Update multiple fields of a ticket
	 */
	async updateFields(ticketId: string, updates: Partial<Ticket>) {
		const supabase = createClient();
		const { data, error } = await supabase
			.from('tickets')
			.update(updates)
			.eq('id', ticketId)
			.select()
			.single();

		if (error) {
			throw new Error(error.message || 'Failed to update ticket');
		}

		return data;
	},

	/**
	 * Create a history entry for a ticket update
	 */
	async createHistoryEntry(
		ticketId: string,
		entry: {
			action: string;
			details: HistoryDetails;
			userId?: string;
		}
	) {
		const supabase = createClient();
		const { error } = await supabase.from('ticket_history').insert({
			ticket_id: ticketId,
			action: entry.action,
			details: entry.details as Json,
			user_id: entry.userId,
		});

		if (error) {
			throw new Error(error.message || 'Failed to create history entry');
		}
	},
};

/**
 * High-level ticket actions for workflow automation
 * These functions use the core ticketOperations and add workflow-specific logic
 */
export const ticketActions = {
	async updateStatus(ticket: Ticket, status: TicketStatus, userId?: string) {
		const data = await ticketOperations.updateField(ticket.id, 'status', status);
		await ticketOperations.createHistoryEntry(ticket.id, {
			action: 'workflow_update_status',
			details: {
				field: 'status',
				old: ticket.status,
				new: status,
			},
			userId,
		});
		return data;
	},

	async assignTicket(ticket: Ticket, userId: string, actionUserId?: string) {
		const data = await ticketOperations.updateField(ticket.id, 'assigned_to', userId);
		await ticketOperations.createHistoryEntry(ticket.id, {
			action: 'workflow_assign',
			details: {
				field: 'assigned_to',
				old: ticket.assigned_to || null,
				new: userId,
			},
			userId: actionUserId,
		});
		return data;
	},

	async updatePriority(ticket: Ticket, priority: TicketPriority, userId?: string) {
		const data = await ticketOperations.updateField(ticket.id, 'priority', priority);
		await ticketOperations.createHistoryEntry(ticket.id, {
			action: 'workflow_update_priority',
			details: {
				field: 'priority',
				old: ticket.priority,
				new: priority,
			},
			userId,
		});
		return data;
	},

	async updateTicket(ticket: Ticket, updates: UpdateTicketRequest, userId?: string) {
		const data = await ticketOperations.updateFields(ticket.id, updates);
		await ticketOperations.createHistoryEntry(ticket.id, {
			action: 'workflow_update',
			details: {
				updates: Object.entries(updates).reduce(
					(acc, [key, value]) => ({
						...acc,
						[key]: value?.toString() || null,
					}),
					{}
				),
			},
			userId,
		});
		return data;
	},
};
