import type { WorkflowContext } from '@/lib/workflows/types';

/**
 * Configuration for a custom action
 */
export interface CustomActionConfig {
	name: string;
	description: string;
	parameters: {
		[key: string]: {
			type: 'string' | 'number' | 'boolean' | 'array' | 'object';
			description: string;
			required?: boolean;
			default?: unknown;
		};
	};
}

/**
 * A custom action implementation
 */
export interface CustomAction {
	config: CustomActionConfig;
	execute: (params: Record<string, unknown>, context: WorkflowContext) => Promise<unknown>;
}

/**
 * Registry of all custom actions
 */
class CustomActionRegistry {
	private actions: Map<string, CustomAction> = new Map();

	/**
	 * Register a new custom action
	 */
	register(action: CustomAction) {
		if (this.actions.has(action.config.name)) {
			throw new Error(`Action "${action.config.name}" is already registered`);
		}
		this.actions.set(action.config.name, action);
	}

	/**
	 * Get a registered action by name
	 */
	get(name: string): CustomAction | undefined {
		return this.actions.get(name);
	}

	/**
	 * List all registered actions
	 */
	list(): CustomAction[] {
		return Array.from(this.actions.values());
	}

	/**
	 * Execute a custom action by name
	 */
	async execute(
		name: string,
		params: Record<string, unknown>,
		context: WorkflowContext
	): Promise<unknown> {
		const action = this.actions.get(name);
		if (!action) {
			throw new Error(`Action "${name}" not found`);
		}

		// Validate parameters
		for (const [key, config] of Object.entries(action.config.parameters)) {
			if (config.required && !(key in params)) {
				throw new Error(`Missing required parameter "${key}" for action "${name}"`);
			}

			if (key in params) {
				const value = params[key];
				// Type validation
				switch (config.type) {
					case 'string':
						if (typeof value !== 'string') {
							throw new Error(
								`Parameter "${key}" for action "${name}" must be a string`
							);
						}
						break;
					case 'number':
						if (typeof value !== 'number') {
							throw new Error(
								`Parameter "${key}" for action "${name}" must be a number`
							);
						}
						break;
					case 'boolean':
						if (typeof value !== 'boolean') {
							throw new Error(
								`Parameter "${key}" for action "${name}" must be a boolean`
							);
						}
						break;
					case 'array':
						if (!Array.isArray(value)) {
							throw new Error(
								`Parameter "${key}" for action "${name}" must be an array`
							);
						}
						break;
					case 'object':
						if (typeof value !== 'object' || value === null || Array.isArray(value)) {
							throw new Error(
								`Parameter "${key}" for action "${name}" must be an object`
							);
						}
						break;
				}
			} else if ('default' in config) {
				params[key] = config.default;
			}
		}

		return action.execute(params, context);
	}
}

/**
 * Global registry instance
 */
export const customActions = new CustomActionRegistry();

/**
 * Example usage:
 *
 * ```typescript
 * // Register a custom action
 * customActions.register({
 *   config: {
 *     name: 'sendSlackMessage',
 *     description: 'Send a message to a Slack channel',
 *     parameters: {
 *       channel: {
 *         type: 'string',
 *         description: 'The Slack channel to send to',
 *         required: true,
 *       },
 *       message: {
 *         type: 'string',
 *         description: 'The message to send',
 *         required: true,
 *       },
 *     },
 *   },
 *   execute: async (params, context) => {
 *     // Implementation here
 *   },
 * });
 *
 * // Execute a custom action
 * await customActions.execute('sendSlackMessage', {
 *   channel: '#support',
 *   message: 'New high-priority ticket',
 * }, context);
 * ```
 */
