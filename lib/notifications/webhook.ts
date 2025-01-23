import { createClient } from '@/lib/supabase/server';
import type { WorkflowContext } from '@/lib/workflows/types';
import crypto from 'crypto';

interface WebhookNotificationParams {
	recipients: string[]; // Array with a single URL
	template: string;
	context: WorkflowContext;
}

export async function sendWebhookNotification({
	recipients,
	template,
	context,
}: WebhookNotificationParams): Promise<void> {
	try {
		const supabase = createClient();
		const webhookUrl = recipients[0];

		// Get ticket details if ticketId is present
		let ticketDetails = null;
		if (context.ticketId) {
			const { data: ticket } = await supabase
				.from('tickets')
				.select(
					`
					*,
					user:users!tickets_user_id_fkey (
						name,
						email
					),
					assignee:users!tickets_assigned_to_fkey (
						name,
						email
					),
					team:teams (
						name
					)
				`
				)
				.eq('id', context.ticketId)
				.single();

			ticketDetails = ticket;
		}

		// Prepare webhook payload
		const payload = {
			event: template,
			data: {
				...context,
				ticket: ticketDetails,
			},
			timestamp: new Date().toISOString(),
		};

		// Send webhook request
		const response = await fetch(webhookUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Webhook-Signature': generateSignature(
					JSON.stringify(payload),
					process.env.WEBHOOK_SECRET || ''
				),
			},
			body: JSON.stringify(payload),
		});

		if (!response.ok) {
			throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`);
		}

		// Log notification
		await supabase.from('notifications').insert({
			type: 'webhook',
			recipients,
			template,
			context: JSON.parse(
				JSON.stringify({
					...context,
					ticket: ticketDetails,
				})
			),
			status: 'sent',
			metadata: {
				response_status: response.status,
				response_body: await response.text(),
			},
		});
	} catch (error) {
		console.error('Failed to send webhook notification:', error);

		// Log failed notification
		const supabase = createClient();
		await supabase.from('notifications').insert({
			type: 'webhook',
			recipients,
			template,
			context: JSON.parse(JSON.stringify(context)),
			status: 'failed',
			error: error instanceof Error ? error.message : 'Unknown error',
		});

		throw error;
	}
}

function generateSignature(payload: string, secret: string): string {
	return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}
