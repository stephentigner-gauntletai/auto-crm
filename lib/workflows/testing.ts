import type {
	Workflow,
	WorkflowStep,
	WorkflowTrigger,
	ConditionStep,
	ActionStep,
	DelayStep,
	NotificationStep,
} from './types';
import { evaluateCondition } from './handlers';

/* eslint-disable @typescript-eslint/no-explicit-any */
interface TestContext {
	data: Record<string, any>;
	results: Record<string, any>;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function testTrigger(
	trigger: WorkflowTrigger,
	data: Record<string, any>
): Promise<boolean> {
	switch (trigger.type) {
		case 'ticket_created':
			return true; // Always triggers for testing
		case 'ticket_updated':
			return true; // Always triggers for testing
		case 'ticket_status_changed':
			const { fromStatus, toStatus } = trigger.conditions || {};
			return (
				(fromStatus === 'any' || data.previousStatus === fromStatus) &&
				(toStatus === 'any' || data.currentStatus === toStatus)
			);
		case 'ticket_priority_changed':
			const { fromPriority, toPriority } = trigger.conditions || {};
			return (
				(fromPriority === 'any' || data.previousPriority === fromPriority) &&
				(toPriority === 'any' || data.currentPriority === toPriority)
			);
		case 'ticket_assigned':
			return true; // Always triggers for testing
		case 'ticket_commented':
			return true; // Always triggers for testing
		case 'scheduled':
			return true; // Always triggers for testing
		default:
			return false;
	}
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function testStep(
	step: WorkflowStep,
	context: TestContext
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<{ success: boolean; nextSteps: string[]; results?: any }> {
	try {
		switch (step.type) {
			case 'condition':
				const conditionStep = step as ConditionStep;
				const conditionResult = await evaluateCondition(conditionStep.config, context.data);
				return {
					success: true,
					nextSteps: conditionResult
						? conditionStep.nextSteps
						: conditionStep.alternateSteps,
					results: { condition: conditionResult },
				};

			case 'action':
				const actionStep = step as ActionStep;
				// Simulate action execution
				return {
					success: true,
					nextSteps: actionStep.nextSteps,
					results: { action: 'simulated' },
				};

			case 'delay':
				const delayStep = step as DelayStep;
				// Simulate delay (no actual delay in testing)
				return {
					success: true,
					nextSteps: delayStep.nextSteps,
					results: { delayed: true },
				};

			case 'notification':
				const notificationStep = step as NotificationStep;
				// Simulate notification
				return {
					success: true,
					nextSteps: notificationStep.nextSteps,
					results: {
						notificationSent: true,
						recipients: notificationStep.config.recipients,
					},
				};

			default:
				return {
					success: false,
					nextSteps: [],
					results: { error: 'Unknown step type' },
				};
		}
	} catch (error) {
		return {
			success: false,
			nextSteps: [],
			results: { error: error instanceof Error ? error.message : 'Unknown error' },
		};
	}
}

export async function getNextSteps(
	workflow: Workflow,
	currentStepIndex: number
): Promise<string[]> {
	if (currentStepIndex === 0) {
		// After trigger, start with first steps
		return workflow.steps.filter((step) => step.isStart).map((step) => step.id);
	}

	const currentStep = workflow.steps[currentStepIndex - 1];
	return currentStep.nextSteps;
}
