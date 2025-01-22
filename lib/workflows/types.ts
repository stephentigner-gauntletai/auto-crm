export type WorkflowTriggerType =
	| 'ticket_created'
	| 'status_changed'
	| 'priority_changed'
	| 'assigned';

export interface WorkflowTrigger {
	type: WorkflowTriggerType;
	conditions: Record<string, unknown>;
}

export type WorkflowStepType = 'condition' | 'action' | 'delay' | 'notification';

export interface BaseWorkflowStep {
	id: string;
	type: WorkflowStepType;
	nextSteps: string[];
}

export interface ConditionStep extends BaseWorkflowStep {
	type: 'condition';
	config: {
		field: string;
		operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
		value: unknown;
	};
}

export interface ActionStep extends BaseWorkflowStep {
	type: 'action';
	config: {
		action: string;
		params: Record<string, unknown>;
	};
}

export interface DelayStep extends BaseWorkflowStep {
	type: 'delay';
	config: {
		duration: number; // in seconds
		durationType: 'seconds' | 'minutes' | 'hours' | 'days';
	};
}

export interface NotificationStep extends BaseWorkflowStep {
	type: 'notification';
	config: {
		type: 'email' | 'in_app' | 'webhook';
		template: string;
		recipients: string[];
		data?: Record<string, unknown>;
	};
}

export type WorkflowStep = ConditionStep | ActionStep | DelayStep | NotificationStep;

export interface Workflow {
	id: string;
	name: string;
	description?: string;
	trigger: WorkflowTrigger;
	steps: WorkflowStep[];
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface WorkflowContext {
	workflowId: string;
	trigger: WorkflowTrigger;
	data: Record<string, unknown>;
	user?: {
		id: string;
		email: string;
		role: string;
	};
}

export interface WorkflowResult {
	success: boolean;
	stepResults: {
		stepId: string;
		success: boolean;
		error?: string;
		output?: unknown;
	}[];
	error?: string;
}
