export type WorkflowTriggerType =
	| 'ticket_created'
	| 'ticket_updated'
	| 'ticket_status_changed'
	| 'ticket_priority_changed'
	| 'ticket_assigned'
	| 'ticket_commented'
	| 'scheduled';

export type WorkflowStepType = 'condition' | 'action' | 'delay' | 'notification';

export interface WorkflowTrigger {
	type: WorkflowTriggerType;
	conditions: Record<string, unknown>;
}

interface BaseWorkflowStep {
	id: string;
	nextSteps: string[];
	isStart: boolean;
}

export interface ConditionStep extends BaseWorkflowStep {
	type: 'condition';
	config: {
		field: string;
		operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
		value: string;
	};
	alternateSteps: string[];
}

export interface ActionStep extends BaseWorkflowStep {
	type: 'action';
	config: {
		action: 'update_ticket' | 'assign_ticket' | 'close_ticket';
		field?: string;
		value?: string;
	};
}

export interface DelayStep extends BaseWorkflowStep {
	type: 'delay';
	config: {
		duration: number;
		unit: 'seconds' | 'minutes' | 'hours' | 'days';
	};
}

export interface NotificationStep extends BaseWorkflowStep {
	type: 'notification';
	config: {
		type: 'email' | 'in_app' | 'webhook';
		template: string;
		recipients: string[];
	};
}

export type WorkflowStep = ConditionStep | ActionStep | DelayStep | NotificationStep;

export interface Workflow {
	id: string;
	name: string;
	description: string;
	trigger: WorkflowTrigger;
	steps: WorkflowStep[];
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface WorkflowContext {
	userId: string;
	teamId: string;
	ticketId?: string;
	data: Record<string, unknown>;
	trigger?: {
		type: WorkflowTriggerType;
		data?: Record<string, unknown>;
	};
}

export interface WorkflowResult {
	success: boolean;
	stepResults: {
		stepId: string;
		success: boolean;
		error?: string;
	}[];
}
