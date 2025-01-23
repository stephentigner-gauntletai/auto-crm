import { customActions } from './custom';

/**
 * Slack Message Action
 * Sends a message to a Slack channel using webhooks
 */
customActions.register({
	config: {
		name: 'sendSlackMessage',
		description: 'Send a message to a Slack channel using webhooks',
		parameters: {
			webhookUrl: {
				type: 'string',
				description: 'Slack webhook URL',
				required: true,
			},
			channel: {
				type: 'string',
				description: 'The Slack channel to send to (e.g., #support)',
				required: true,
			},
			message: {
				type: 'string',
				description: 'The message to send',
				required: true,
			},
			username: {
				type: 'string',
				description: 'Display name for the bot',
				default: 'AutoCRM Bot',
			},
			icon_emoji: {
				type: 'string',
				description: 'Emoji to use as the bot icon',
				default: ':robot_face:',
			},
		},
	},
	execute: async (params) => {
		const { webhookUrl, channel, message, username, icon_emoji } = params as {
			webhookUrl: string;
			channel: string;
			message: string;
			username: string;
			icon_emoji: string;
		};

		const response = await fetch(webhookUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				channel,
				text: message,
				username,
				icon_emoji,
			}),
		});

		if (!response.ok) {
			throw new Error(`Failed to send Slack message: ${response.statusText}`);
		}

		return { success: true, timestamp: new Date().toISOString() };
	},
});

/**
 * External API Call Action
 * Makes a request to any REST API endpoint
 */
customActions.register({
	config: {
		name: 'callExternalApi',
		description: 'Make a request to an external API endpoint',
		parameters: {
			url: {
				type: 'string',
				description: 'API endpoint URL',
				required: true,
			},
			method: {
				type: 'string',
				description: 'HTTP method to use',
				default: 'GET',
			},
			headers: {
				type: 'object',
				description: 'HTTP headers to include',
				default: {},
			},
			body: {
				type: 'object',
				description: 'Request body (for POST/PUT/PATCH)',
				default: null,
			},
			timeout: {
				type: 'number',
				description: 'Request timeout in milliseconds',
				default: 5000,
			},
		},
	},
	execute: async (params) => {
		const { url, method, headers, body, timeout } = params as {
			url: string;
			method: string;
			headers: Record<string, string>;
			body: unknown;
			timeout: number;
		};

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), timeout);

		try {
			const response = await fetch(url, {
				method,
				headers: {
					'Content-Type': 'application/json',
					...headers,
				},
				body: body ? JSON.stringify(body) : undefined,
				signal: controller.signal,
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(`API request failed: ${response.statusText}`);
			}

			return {
				success: true,
				status: response.status,
				data,
			};
		} finally {
			clearTimeout(timeoutId);
		}
	},
});

/**
 * Data Transformation Action
 * Transforms data using JSON templates and path expressions
 */
customActions.register({
	config: {
		name: 'transformData',
		description: 'Transform data using a template and path expressions',
		parameters: {
			template: {
				type: 'object',
				description: 'Template object with path expressions',
				required: true,
			},
			data: {
				type: 'object',
				description: 'Source data to transform',
				required: true,
			},
			options: {
				type: 'object',
				description: 'Transformation options',
				default: {
					nullIfMissing: true,
					dateFormat: 'ISO',
				},
			},
		},
	},
	execute: async (params) => {
		const { template, data, options } = params as {
			template: Record<string, unknown>;
			data: Record<string, unknown>;
			options: {
				nullIfMissing: boolean;
				dateFormat: string;
			};
		};

		function resolveValue(path: string, source: Record<string, unknown>): unknown {
			const parts = path.split('.');
			let value = source;

			for (const part of parts) {
				if (value === undefined || value === null) {
					return options.nullIfMissing ? null : undefined;
				}
				value = value[part] as Record<string, unknown>;
			}

			// Format dates if the value is a date string
			if (
				typeof value === 'string' &&
				options.dateFormat === 'ISO' &&
				/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)
			) {
				return new Date(value).toISOString();
			}

			return value;
		}

		function transformObject(
			tmpl: Record<string, unknown>,
			source: Record<string, unknown>
		): Record<string, unknown> {
			const result: Record<string, unknown> = {};

			for (const [key, value] of Object.entries(tmpl)) {
				if (typeof value === 'string' && value.startsWith('$.')) {
					// Path expression
					result[key] = resolveValue(value.slice(2), source);
				} else if (typeof value === 'object' && value !== null) {
					// Nested template
					result[key] = transformObject(value as Record<string, unknown>, source);
				} else {
					// Static value
					result[key] = value;
				}
			}

			return result;
		}

		return transformObject(template, data);
	},
});
