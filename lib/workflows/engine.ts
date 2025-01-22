import type {
	Workflow,
	WorkflowContext,
	WorkflowResult,
	WorkflowStep,
	ConditionStep,
} from './types';
import { handleValidationError } from '@/lib/errors';

export class WorkflowEngine {
	private visitedSteps: Set<string>;

	constructor() {
		this.visitedSteps = new Set();
	}

	async executeWorkflow(workflow: Workflow, context: WorkflowContext): Promise<WorkflowResult> {
		try {
			// Validate workflow before execution
			this.validateWorkflow(workflow);

			// Reset visited steps
			this.visitedSteps.clear();

			// Find starting steps (steps not referenced as nextSteps in any other step)
			const startingSteps = this.findStartingSteps(workflow);
			const stepResults: WorkflowResult['stepResults'] = [];

			// Execute each starting step and their subsequent steps
			for (const stepId of startingSteps) {
				await this.executeStep(workflow, stepId, context, stepResults);
			}

			return {
				success: true,
				stepResults,
			};
		} catch (error) {
			return {
				success: false,
				stepResults: [],
				error: error instanceof Error ? error.message : 'Unknown error occurred',
			};
		}
	}

	private validateWorkflow(workflow: Workflow): void {
		// Check for required fields
		if (!workflow.name || !workflow.trigger || !Array.isArray(workflow.steps)) {
			handleValidationError('Invalid workflow structure');
		}

		// Check for duplicate step IDs
		const stepIds = new Set<string>();
		for (const step of workflow.steps) {
			if (stepIds.has(step.id)) {
				handleValidationError(`Duplicate step ID: ${step.id}`);
			}
			stepIds.add(step.id);
		}

		// Check for invalid step references
		for (const step of workflow.steps) {
			for (const nextStepId of step.nextSteps) {
				if (!stepIds.has(nextStepId)) {
					handleValidationError(`Invalid step reference: ${nextStepId}`);
				}
			}
		}

		// Detect cycles
		this.detectCycles(workflow);
	}

	private detectCycles(workflow: Workflow): void {
		const visited = new Set<string>();
		const recursionStack = new Set<string>();

		const dfs = (stepId: string) => {
			visited.add(stepId);
			recursionStack.add(stepId);

			const step = workflow.steps.find((s) => s.id === stepId);
			if (step) {
				for (const nextStepId of step.nextSteps) {
					if (!visited.has(nextStepId)) {
						dfs(nextStepId);
					} else if (recursionStack.has(nextStepId)) {
						handleValidationError(`Cycle detected in workflow: ${nextStepId}`);
					}
				}
			}

			recursionStack.delete(stepId);
		};

		// Start DFS from each unvisited starting step
		const startingSteps = this.findStartingSteps(workflow);
		for (const stepId of startingSteps) {
			if (!visited.has(stepId)) {
				dfs(stepId);
			}
		}
	}

	private findStartingSteps(workflow: Workflow): string[] {
		const allStepIds = new Set(workflow.steps.map((step) => step.id));
		const nextStepIds = new Set(workflow.steps.flatMap((step) => step.nextSteps));

		return Array.from(allStepIds).filter((id) => !nextStepIds.has(id));
	}

	private async executeStep(
		workflow: Workflow,
		stepId: string,
		context: WorkflowContext,
		stepResults: WorkflowResult['stepResults']
	): Promise<void> {
		// Prevent infinite loops and duplicate execution
		if (this.visitedSteps.has(stepId)) {
			return;
		}
		this.visitedSteps.add(stepId);

		const step = workflow.steps.find((s) => s.id === stepId);
		if (!step) {
			throw new Error(`Step not found: ${stepId}`);
		}

		try {
			let shouldContinue = true;
			let output: unknown;

			switch (step.type) {
				case 'condition':
					shouldContinue = await this.evaluateCondition(step, context);
					break;
				case 'action':
					output = await this.executeAction(step, context);
					break;
				case 'delay':
					await this.executeDelay(step);
					break;
				case 'notification':
					await this.sendNotification(step, context);
					break;
			}

			stepResults.push({
				stepId,
				success: true,
				output,
			});

			if (shouldContinue) {
				// Execute next steps
				for (const nextStepId of step.nextSteps) {
					await this.executeStep(workflow, nextStepId, context, stepResults);
				}
			}
		} catch (error) {
			stepResults.push({
				stepId,
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error; // Re-throw to stop the workflow
		}
	}

	private async evaluateCondition(
		step: ConditionStep,
		context: WorkflowContext
	): Promise<boolean> {
		const { field, operator, value } = step.config;
		const fieldValue = this.getFieldValue(field, context);

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
				throw new Error(`Unknown operator: ${operator}`);
		}
	}

	private getFieldValue(field: string, context: WorkflowContext): unknown {
		const parts = field.split('.');
		let value: unknown = context.data;

		for (const part of parts) {
			if (value && typeof value === 'object' && part in value) {
				value = (value as Record<string, unknown>)[part];
			} else {
				return undefined;
			}
		}

		return value;
	}

	private async executeAction(
		step: WorkflowStep & { type: 'action' },
		context: WorkflowContext
	): Promise<unknown> {
		const { action, params } = step.config;
		// Action execution will be implemented in separate modules
		const actionModule = await import(`./actions/${action}`);
		return actionModule.default(params, context);
	}

	private async executeDelay(step: WorkflowStep & { type: 'delay' }): Promise<void> {
		const { duration, durationType } = step.config;
		let milliseconds = duration * 1000; // Convert seconds to milliseconds

		switch (durationType) {
			case 'minutes':
				milliseconds *= 60;
				break;
			case 'hours':
				milliseconds *= 60 * 60;
				break;
			case 'days':
				milliseconds *= 60 * 60 * 24;
				break;
		}

		await new Promise((resolve) => setTimeout(resolve, milliseconds));
	}

	private async sendNotification(
		step: WorkflowStep & { type: 'notification' },
		context: WorkflowContext
	): Promise<void> {
		const { type, template, recipients, data } = step.config;
		// Notification sending will be implemented in separate modules
		const notificationModule = await import(`./notifications/${type}`);
		await notificationModule.default({
			template,
			recipients,
			data: {
				...data,
				context,
			},
		});
	}
}
