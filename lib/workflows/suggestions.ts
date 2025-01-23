import type { WorkflowTriggerType } from './types';

export interface FieldSuggestion {
	path: string;
	description: string;
	type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
	example?: string;
}

// Common ticket fields available in all contexts
export const COMMON_FIELDS: FieldSuggestion[] = [
	{
		path: 'ticket.id',
		description: 'Unique identifier of the ticket',
		type: 'string',
		example: 'ticket-123',
	},
	{
		path: 'ticket.title',
		description: 'Title of the ticket',
		type: 'string',
		example: 'Login not working',
	},
	{
		path: 'ticket.description',
		description: 'Full description of the ticket',
		type: 'string',
	},
	{
		path: 'ticket.status',
		description: 'Current status of the ticket',
		type: 'string',
		example: 'open',
	},
	{
		path: 'ticket.priority',
		description: 'Priority level of the ticket',
		type: 'string',
		example: 'high',
	},
	{
		path: 'ticket.assignedTo',
		description: 'ID of the agent assigned to the ticket',
		type: 'string',
		example: 'agent-456',
	},
	{
		path: 'ticket.customer.id',
		description: 'ID of the customer who created the ticket',
		type: 'string',
		example: 'customer-789',
	},
	{
		path: 'ticket.customer.email',
		description: 'Email of the customer',
		type: 'string',
		example: 'customer@example.com',
	},
	{
		path: 'ticket.createdAt',
		description: 'When the ticket was created',
		type: 'date',
		example: '2024-03-14T12:00:00Z',
	},
	{
		path: 'ticket.updatedAt',
		description: 'When the ticket was last updated',
		type: 'date',
		example: '2024-03-14T14:30:00Z',
	},
];

// Additional fields available based on trigger type
export const TRIGGER_SPECIFIC_FIELDS: Record<WorkflowTriggerType, FieldSuggestion[]> = {
	ticket_created: [], // All common fields available
	ticket_updated: [
		{
			path: 'previousValues',
			description: 'Previous values before the update',
			type: 'object',
		},
	],
	ticket_status_changed: [
		{
			path: 'previousStatus',
			description: 'Previous status before the change',
			type: 'string',
			example: 'open',
		},
		{
			path: 'currentStatus',
			description: 'New status after the change',
			type: 'string',
			example: 'in_progress',
		},
	],
	ticket_priority_changed: [
		{
			path: 'previousPriority',
			description: 'Previous priority before the change',
			type: 'string',
			example: 'medium',
		},
		{
			path: 'currentPriority',
			description: 'New priority after the change',
			type: 'string',
			example: 'high',
		},
	],
	ticket_assigned: [
		{
			path: 'previousAssignee',
			description: 'Previous assignee before the change',
			type: 'string',
			example: 'agent-123',
		},
	],
	ticket_commented: [
		{
			path: 'comment.content',
			description: 'Content of the new comment',
			type: 'string',
		},
		{
			path: 'comment.author',
			description: 'ID of the comment author',
			type: 'string',
			example: 'agent-456',
		},
	],
	scheduled: [
		{
			path: 'currentTime',
			description: 'Current time when the scheduled workflow runs',
			type: 'date',
			example: '2024-03-14T00:00:00Z',
		},
		{
			path: 'lastExecutionTime',
			description: 'When the workflow was last executed',
			type: 'date',
			example: '2024-03-13T00:00:00Z',
		},
	],
};

export function getFieldSuggestions(
	triggerType: WorkflowTriggerType,
	currentInput: string
): FieldSuggestion[] {
	// Get all available fields for this trigger type
	const availableFields = [...COMMON_FIELDS, ...(TRIGGER_SPECIFIC_FIELDS[triggerType] || [])];

	// If no input, return all fields
	if (!currentInput) {
		return availableFields;
	}

	// Filter fields based on input
	return availableFields.filter((field) =>
		field.path.toLowerCase().includes(currentInput.toLowerCase())
	);
}

export function getOperatorSuggestions(fieldType: FieldSuggestion['type']): string[] {
	switch (fieldType) {
		case 'string':
			return ['equals', 'not_equals', 'contains', 'starts_with', 'ends_with'];
		case 'number':
			return ['equals', 'not_equals', 'greater_than', 'less_than', 'between'];
		case 'boolean':
			return ['equals'];
		case 'date':
			return [
				'equals',
				'not_equals',
				'greater_than',
				'less_than',
				'between',
				'within_last',
				'within_next',
			];
		default:
			return ['equals', 'not_equals'];
	}
}

export function getValueSuggestions(field: FieldSuggestion, operator: string): string[] {
	// Special cases for specific fields
	if (field.path === 'ticket.status') {
		return ['new', 'open', 'in_progress', 'resolved', 'closed'];
	}
	if (field.path === 'ticket.priority') {
		return ['low', 'medium', 'high', 'urgent'];
	}
	if (field.path === 'ticket.team_id') {
		return ['current_team']; // Placeholder - would be populated from actual teams
	}
	if (field.path === 'ticket.assigned_to') {
		return ['current_user', 'unassigned']; // Placeholder - would be populated from actual users
	}

	// Handle different field types and operators
	switch (field.type) {
		case 'boolean':
			return ['true', 'false'];

		case 'date':
			switch (operator) {
				case 'within_last':
				case 'within_next':
					return [
						'1 hour',
						'24 hours',
						'7 days',
						'30 days',
						'3 months',
						'6 months',
						'1 year',
					];
				case 'between':
					return ['now', 'tomorrow', 'next_week', 'next_month', 'custom'];
				default:
					return ['now', 'today', 'yesterday', 'tomorrow'];
			}

		case 'number':
			switch (operator) {
				case 'between':
					return ['0-10', '11-20', '21-50', '51-100', 'custom'];
				case 'greater_than':
				case 'less_than':
					return ['0', '10', '20', '50', '100', '1000'];
				default:
					return ['0', '1', '5', '10', '20', '50', '100'];
			}

		case 'string':
			switch (operator) {
				case 'contains':
					if (field.path.includes('email')) {
						return ['@gmail.com', '@yahoo.com', '@hotmail.com', '@company.com'];
					}
					if (field.path.includes('name')) {
						return ['admin', 'support', 'sales', 'test'];
					}
					return [];
				case 'starts_with':
					if (field.path.includes('email')) {
						return ['admin@', 'support@', 'sales@', 'no-reply@'];
					}
					if (field.path.includes('name')) {
						return ['Admin', 'Support', 'Sales', 'Test'];
					}
					return [];
				default:
					return field.example ? [field.example] : [];
			}

		default:
			return [];
	}
}
