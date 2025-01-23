import type {
	WorkflowTrigger,
	WorkflowStep,
	ConditionStep,
	ActionStep,
	DelayStep,
	NotificationStep,
} from '@/lib/workflows/types';

interface ValidationError {
	field: string;
	message: string;
}

interface ValidationResult {
	isValid: boolean;
	errors: ValidationError[];
}

interface ValidationState {
	settings: ValidationResult;
	trigger: ValidationResult;
	steps: Record<string, ValidationResult>;
	global: ValidationResult;
}

export function useWorkflowValidation(
	name: string,
	description: string,
	trigger: WorkflowTrigger,
	steps: WorkflowStep[]
) {
	const validateSettings = (): ValidationResult => {
		const errors: ValidationError[] = [];

		if (!name.trim()) {
			errors.push({
				field: 'name',
				message: 'Workflow name is required',
			});
		} else if (name.length < 3) {
			errors.push({
				field: 'name',
				message: 'Workflow name must be at least 3 characters',
			});
		}

		if (description.length > 500) {
			errors.push({
				field: 'description',
				message: 'Description must be less than 500 characters',
			});
		}

		return {
			isValid: errors.length === 0,
			errors,
		};
	};

	const validateTrigger = (): ValidationResult => {
		const errors: ValidationError[] = [];

		if (!trigger.type) {
			errors.push({
				field: 'type',
				message: 'Trigger type is required',
			});
		}

		// Validate trigger-specific conditions
		switch (trigger.type) {
			case 'ticket_status_changed':
				if (!trigger.conditions?.fromStatus) {
					errors.push({
						field: 'fromStatus',
						message: 'From status is required',
					});
				}
				if (!trigger.conditions?.toStatus) {
					errors.push({
						field: 'toStatus',
						message: 'To status is required',
					});
				}
				break;
			case 'ticket_priority_changed':
				if (!trigger.conditions?.fromPriority) {
					errors.push({
						field: 'fromPriority',
						message: 'From priority is required',
					});
				}
				if (!trigger.conditions?.toPriority) {
					errors.push({
						field: 'toPriority',
						message: 'To priority is required',
					});
				}
				break;
			case 'scheduled':
				if (!trigger.conditions?.scheduleType) {
					errors.push({
						field: 'scheduleType',
						message: 'Schedule type is required',
					});
				} else if (trigger.conditions.scheduleType === 'interval') {
					const interval = Number(trigger.conditions.interval);
					if (isNaN(interval) || interval < 1) {
						errors.push({
							field: 'interval',
							message: 'Interval must be at least 1',
						});
					}
					if (!trigger.conditions.intervalType) {
						errors.push({
							field: 'intervalType',
							message: 'Interval type is required',
						});
					}
				} else if (trigger.conditions.scheduleType === 'cron') {
					if (!trigger.conditions.cron) {
						errors.push({
							field: 'cron',
							message: 'Cron expression is required',
						});
					}
					// TODO: Add cron expression validation
				}
				break;
		}

		return {
			isValid: errors.length === 0,
			errors,
		};
	};

	const validateStep = (step: WorkflowStep): ValidationResult => {
		const errors: ValidationError[] = [];

		if (!step.id) {
			errors.push({
				field: 'id',
				message: 'Step ID is required',
			});
		}

		switch (step.type) {
			case 'condition': {
				const config = (step as ConditionStep).config;
				if (!config.field) {
					errors.push({
						field: 'field',
						message: 'Field is required',
					});
				}
				if (!config.operator) {
					errors.push({
						field: 'operator',
						message: 'Operator is required',
					});
				}
				if (config.value === undefined || config.value === '') {
					errors.push({
						field: 'value',
						message: 'Value is required',
					});
				}
				break;
			}
			case 'action': {
				const config = (step as ActionStep).config;
				if (!config.action) {
					errors.push({
						field: 'action',
						message: 'Action is required',
					});
				}
				if (config.action === 'update_ticket') {
					if (!config.field) {
						errors.push({
							field: 'field',
							message: 'Field is required',
						});
					}
					if (!config.value) {
						errors.push({
							field: 'value',
							message: 'Value is required',
						});
					}
				}
				if (config.action === 'assign_ticket' && !config.value) {
					errors.push({
						field: 'value',
						message: 'User ID is required',
					});
				}
				break;
			}
			case 'delay': {
				const config = (step as DelayStep).config;
				if (!config.duration || config.duration < 1) {
					errors.push({
						field: 'duration',
						message: 'Duration must be at least 1',
					});
				}
				if (!config.unit) {
					errors.push({
						field: 'unit',
						message: 'Unit is required',
					});
				}
				break;
			}
			case 'notification': {
				const config = (step as NotificationStep).config;
				if (!config.type) {
					errors.push({
						field: 'type',
						message: 'Notification type is required',
					});
				}
				if (!config.template) {
					errors.push({
						field: 'template',
						message: 'Template is required',
					});
				}
				if (!config.recipients || config.recipients.length === 0) {
					errors.push({
						field: 'recipients',
						message: 'At least one recipient is required',
					});
				}
				break;
			}
		}

		return {
			isValid: errors.length === 0,
			errors,
		};
	};

	const validateGlobal = (): ValidationResult => {
		const errors: ValidationError[] = [];

		if (steps.length === 0) {
			errors.push({
				field: 'steps',
				message: 'At least one step is required',
			});
		}

		// Check for duplicate step IDs
		const stepIds = new Set<string>();
		for (const step of steps) {
			if (stepIds.has(step.id)) {
				errors.push({
					field: `step_${step.id}`,
					message: `Duplicate step ID: ${step.id}`,
				});
			}
			stepIds.add(step.id);
		}

		// Check for invalid step references
		for (const step of steps) {
			for (const nextStepId of step.nextSteps) {
				if (!stepIds.has(nextStepId)) {
					errors.push({
						field: `step_${step.id}`,
						message: `Invalid step reference: ${nextStepId}`,
					});
				}
			}
		}

		// Check for cycles
		try {
			detectCycles(steps);
		} catch (error) {
			errors.push({
				field: 'steps',
				message: error instanceof Error ? error.message : 'Cycle detected in workflow',
			});
		}

		return {
			isValid: errors.length === 0,
			errors,
		};
	};

	const detectCycles = (steps: WorkflowStep[]): void => {
		const visited = new Set<string>();
		const recursionStack = new Set<string>();

		const dfs = (stepId: string) => {
			visited.add(stepId);
			recursionStack.add(stepId);

			const step = steps.find((s) => s.id === stepId);
			if (!step) {
				throw new Error(`Step not found: ${stepId}`);
			}

			for (const nextStepId of step.nextSteps) {
				if (!visited.has(nextStepId)) {
					dfs(nextStepId);
				} else if (recursionStack.has(nextStepId)) {
					throw new Error(`Cycle detected: ${stepId} -> ${nextStepId}`);
				}
			}

			recursionStack.delete(stepId);
		};

		for (const step of steps) {
			if (!visited.has(step.id)) {
				dfs(step.id);
			}
		}
	};

	const validationState: ValidationState = {
		settings: validateSettings(),
		trigger: validateTrigger(),
		steps: Object.fromEntries(steps.map((step) => [step.id, validateStep(step)])),
		global: validateGlobal(),
	};

	const isValid =
		validationState.settings.isValid &&
		validationState.trigger.isValid &&
		Object.values(validationState.steps).every((result) => result.isValid) &&
		validationState.global.isValid;

	return {
		isValid,
		validationState,
	};
}
