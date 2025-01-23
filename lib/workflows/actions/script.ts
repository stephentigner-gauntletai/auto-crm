import { customActions } from './custom';
import type { WorkflowContext } from '@/lib/workflows/types';

/**
 * Sandbox environment for script execution
 * Provides safe access to workflow context and utilities
 */
function createSandbox(context: WorkflowContext) {
	return {
		// Safe data access
		data: context.data,
		ticketId: context.ticketId,
		userId: context.userId,
		teamId: context.teamId,
		trigger: context.trigger,

		// Utility functions
		formatDate: (date: string | Date) => new Date(date).toISOString(),
		parseJSON: (str: string) => JSON.parse(str),
		stringify: (obj: unknown) => JSON.stringify(obj),

		// Math utilities
		round: Math.round,
		floor: Math.floor,
		ceil: Math.ceil,
		min: Math.min,
		max: Math.max,

		// String utilities
		toLowerCase: (str: string) => str.toLowerCase(),
		toUpperCase: (str: string) => str.toUpperCase(),
		trim: (str: string) => str.trim(),
		replace: (str: string, search: string, replace: string) => str.replace(search, replace),
		split: (str: string, separator: string) => str.split(separator),
		join: (arr: unknown[], separator: string) => arr.join(separator),

		// Array utilities
		map: <T, U>(arr: T[], fn: (item: T) => U) => arr.map(fn),
		filter: <T>(arr: T[], fn: (item: T) => boolean) => arr.filter(fn),
		find: <T>(arr: T[], fn: (item: T) => boolean) => arr.find(fn),
		some: <T>(arr: T[], fn: (item: T) => boolean) => arr.some(fn),
		every: <T>(arr: T[], fn: (item: T) => boolean) => arr.every(fn),
	};
}

/**
 * Execute a script in a sandboxed environment
 */
async function executeScript(script: string, context: WorkflowContext): Promise<unknown> {
	// Create sandbox with safe utilities and context
	const sandbox = createSandbox(context);

	// Create function from script with sandbox variables in scope
	const scriptFn = new Function(
		...Object.keys(sandbox),
		`"use strict";
		try {
			${script}
		} catch (error) {
			throw new Error(\`Script execution failed: \${error.message}\`);
		}`
	);

	// Execute script with sandbox values
	return scriptFn(...Object.values(sandbox));
}

/**
 * Register custom script action
 */
customActions.register({
	config: {
		name: 'executeScript',
		description: 'Execute a custom JavaScript/TypeScript script',
		parameters: {
			script: {
				type: 'string',
				description:
					'The script to execute. Has access to workflow context and safe utility functions.',
				required: true,
			},
			timeout: {
				type: 'number',
				description: 'Maximum execution time in milliseconds',
				default: 5000,
			},
		},
	},
	execute: async (params, context) => {
		const { script, timeout } = params as {
			script: string;
			timeout: number;
		};

		// Execute with timeout
		const timeoutPromise = new Promise((_, reject) => {
			setTimeout(() => reject(new Error('Script execution timed out')), timeout);
		});

		const executionPromise = executeScript(script, context);
		const result = await Promise.race([executionPromise, timeoutPromise]);

		return {
			success: true,
			result,
		};
	},
});
