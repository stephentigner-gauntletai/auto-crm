import type { Workflow, WorkflowContext, WorkflowResult } from './types';
import { createClient } from '@/lib/supabase/server';
import { executeStep } from './handlers';

export class WorkflowEngine {
	private visitedSteps: Set<string>;

	constructor() {
		this.visitedSteps = new Set();
	}

	async executeWorkflow(workflow: Workflow, context: WorkflowContext): Promise<WorkflowResult> {
		try {
			this.validateWorkflow(workflow);
			const startingSteps = this.findStartingSteps(workflow.steps);
			const stepResults = await this.executeSteps(startingSteps, workflow.steps, context);

			return {
				success: stepResults.every((result) => result.success),
				stepResults,
			};
		} catch {
			return {
				success: false,
				stepResults: [],
			};
		} finally {
			this.visitedSteps.clear();
		}
	}

	private validateWorkflow(workflow: Workflow): void {
		// Check required fields
		if (!workflow.name || !workflow.trigger || !workflow.steps) {
			throw new Error('Missing required workflow fields');
		}

		// Check for duplicate step IDs
		const stepIds = new Set<string>();
		for (const step of workflow.steps) {
			if (stepIds.has(step.id)) {
				throw new Error(`Duplicate step ID: ${step.id}`);
			}
			stepIds.add(step.id);
		}

		// Check for invalid step references
		for (const step of workflow.steps) {
			for (const nextStepId of step.nextSteps) {
				if (!stepIds.has(nextStepId)) {
					throw new Error(`Invalid step reference: ${nextStepId} in step ${step.id}`);
				}
			}
		}

		// Check for cycles
		this.detectCycles(workflow.steps);
	}

	private detectCycles(steps: Workflow['steps']): void {
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
	}

	private findStartingSteps(steps: Workflow['steps']): string[] {
		const referencedSteps = new Set<string>();
		for (const step of steps) {
			for (const nextStepId of step.nextSteps) {
				referencedSteps.add(nextStepId);
			}
		}

		return steps.filter((step) => !referencedSteps.has(step.id)).map((step) => step.id);
	}

	private async executeSteps(
		stepIds: string[],
		allSteps: Workflow['steps'],
		context: WorkflowContext
	): Promise<
		{
			stepId: string;
			success: boolean;
			error?: string;
		}[]
	> {
		const results: {
			stepId: string;
			success: boolean;
			error?: string;
		}[] = [];

		for (const stepId of stepIds) {
			if (this.visitedSteps.has(stepId)) {
				continue;
			}

			const step = allSteps.find((s) => s.id === stepId);
			if (!step) {
				results.push({
					stepId,
					success: false,
					error: `Step not found: ${stepId}`,
				});
				continue;
			}

			this.visitedSteps.add(stepId);

			try {
				const result = await executeStep(step, context);
				results.push({
					stepId,
					success: result.success,
					error: result.error,
				});

				if (result.success && result.nextSteps.length > 0) {
					const nextResults = await this.executeSteps(
						result.nextSteps,
						allSteps,
						context
					);
					results.push(...nextResults);
				}
			} catch (error) {
				results.push({
					stepId,
					success: false,
					error: error instanceof Error ? error.message : 'Unknown error',
				});
			}
		}

		return results;
	}

	async logExecution(
		workflowId: string,
		context: WorkflowContext,
		result: WorkflowResult
	): Promise<void> {
		const supabase = createClient();

		await supabase.from('workflow_executions').insert({
			workflow_id: workflowId,
			trigger_type: context.trigger?.type ?? 'manual',
			context: JSON.parse(JSON.stringify(context)),
			status: result.success ? 'completed' : 'failed',
			started_at: new Date().toISOString(),
			completed_at: new Date().toISOString(),
			error: result.success ? undefined : result.stepResults.find((r) => !r.success)?.error,
			step_results: JSON.parse(JSON.stringify(result.stepResults)),
		});
	}
}
