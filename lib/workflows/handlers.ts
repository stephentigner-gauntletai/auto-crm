import { createClient } from '@/lib/supabase/server';
import type {
	WorkflowStep,
	ConditionStep,
	ActionStep,
	DelayStep,
	NotificationStep,
	WorkflowContext,
} from './types';

export async function executeStep(
	step: WorkflowStep,
	context: WorkflowContext
): Promise<{
	success: boolean;
	error?: string;
	nextSteps: string[];
}> {
	try {
		const stepType = step.type;
		switch (stepType) {
			case 'condition':
				return await executeConditionStep(step as ConditionStep, context);
			case 'action':
				return await executeActionStep(step as ActionStep, context);
			case 'delay':
				return await executeDelayStep(step as DelayStep, context);
			case 'notification':
				return await executeNotificationStep(step as NotificationStep, context);
			default: {
				const exhaustiveCheck: never = stepType;
				throw new Error(`Unknown step type: ${exhaustiveCheck}`);
			}
		}
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
			nextSteps: [],
		};
	}
}

async function executeConditionStep(
	step: ConditionStep,
	context: WorkflowContext
): Promise<{
	success: boolean;
	error?: string;
	nextSteps: string[];
}> {
	const { field, operator, value } = step.config;
	const fieldValue = getFieldValue(context.data, field);

	let result = false;
	switch (operator) {
		case 'equals':
			result = fieldValue === value;
			break;
		case 'not_equals':
			result = fieldValue !== value;
			break;
		case 'contains':
			result = String(fieldValue).includes(String(value));
			break;
		case 'greater_than':
			result = Number(fieldValue) > Number(value);
			break;
		case 'less_than':
			result = Number(fieldValue) < Number(value);
			break;
		default:
			throw new Error(`Unknown operator: ${operator}`);
	}

	return {
		success: true,
		nextSteps: result ? step.nextSteps : [],
	};
}

async function executeActionStep(
	step: ActionStep,
	context: WorkflowContext
): Promise<{
	success: boolean;
	error?: string;
	nextSteps: string[];
}> {
	const supabase = createClient();
	const { action, field, value } = step.config;

	try {
		if (!context.ticketId) {
			throw new Error('Ticket ID is required for action steps');
		}

		switch (action) {
			case 'update_ticket':
				if (!field || !value) {
					throw new Error('Field and value are required for update_ticket action');
				}
				await supabase
					.from('tickets')
					.update({ [field]: value })
					.eq('id', context.ticketId);
				break;
			case 'assign_ticket':
				if (!value) {
					throw new Error('User ID is required for assign_ticket action');
				}
				await supabase
					.from('tickets')
					.update({ assigned_to: value })
					.eq('id', context.ticketId);
				break;
			case 'close_ticket':
				await supabase
					.from('tickets')
					.update({ status: 'closed' })
					.eq('id', context.ticketId);
				break;
			default: {
				const exhaustiveCheck: never = action;
				throw new Error(`Unknown action: ${exhaustiveCheck}`);
			}
		}

		await createHistoryEntry(context.ticketId, {
			action: `workflow_${action}`,
			details: { field, value },
			userId: context.userId,
		});

		return {
			success: true,
			nextSteps: step.nextSteps,
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
			nextSteps: [],
		};
	}
}

async function executeDelayStep(
	step: DelayStep,
	// This unused context parameter is to maintain interface consistency
	// with the other execute step functions.
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	context: WorkflowContext
): Promise<{
	success: boolean;
	error?: string;
	nextSteps: string[];
}> {
	const { duration, unit } = step.config;
	let milliseconds = duration;

	switch (unit) {
		case 'seconds':
			milliseconds *= 1000;
			break;
		case 'minutes':
			milliseconds *= 60 * 1000;
			break;
		case 'hours':
			milliseconds *= 60 * 60 * 1000;
			break;
		case 'days':
			milliseconds *= 24 * 60 * 60 * 1000;
			break;
		default:
			throw new Error(`Unknown duration type: ${unit}`);
	}

	await new Promise((resolve) => setTimeout(resolve, milliseconds));

	return {
		success: true,
		nextSteps: step.nextSteps,
	};
}

async function executeNotificationStep(
	step: NotificationStep,
	context: WorkflowContext
): Promise<{
	success: boolean;
	error?: string;
	nextSteps: string[];
}> {
	const { type, template, recipients } = step.config;

	try {
		switch (type) {
			case 'email':
				await sendEmail(recipients, template, context);
				break;
			case 'in_app':
				await createInAppNotification(recipients, template, context);
				break;
			case 'webhook':
				await sendWebhookNotification(recipients[0], template, context);
				break;
			default:
				throw new Error(`Unknown notification type: ${type}`);
		}

		return {
			success: true,
			nextSteps: step.nextSteps,
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
			nextSteps: [],
		};
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getFieldValue(data: Record<string, any>, field: string): any {
	const parts = field.split('.');
	let value = data;

	for (const part of parts) {
		if (value === undefined || value === null) {
			return undefined;
		}
		value = value[part];
	}

	return value;
}

async function createHistoryEntry(
	ticketId: string,
	entry: {
		action: string;
		details: Record<string, unknown>;
		userId: string;
	}
) {
	const supabase = createClient();
	await supabase.from('ticket_history').insert({
		ticket_id: ticketId,
		action: entry.action,
		details: JSON.parse(JSON.stringify(entry.details)),
		user_id: entry.userId,
	});
}

async function sendEmail(recipients: string[], template: string, context: WorkflowContext) {
	// TODO: Implement email sending
	console.log('Sending email', { recipients, template, context });
}

async function createInAppNotification(
	recipients: string[],
	template: string,
	context: WorkflowContext
) {
	// TODO: Implement in-app notifications
	console.log('Creating in-app notification', {
		recipients,
		template,
		context,
	});
}

async function sendWebhookNotification(url: string, template: string, context: WorkflowContext) {
	// TODO: Implement webhook notifications
	console.log('Sending webhook notification', { url, template, context });
}

export async function evaluateCondition(
	config: ConditionStep['config'],
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	data: Record<string, any>
): Promise<boolean> {
	const { field, operator, value } = config;
	const fieldValue = getFieldValue(data, field);

	switch (operator) {
		case 'equals':
			return fieldValue === value;
		case 'not_equals':
			return fieldValue !== value;
		case 'contains':
			return String(fieldValue).includes(String(value));
		case 'greater_than':
			return Number(fieldValue) > Number(value);
		case 'less_than':
			return Number(fieldValue) < Number(value);
		default:
			return false;
	}
}
