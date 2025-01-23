import { createClient } from '@/lib/supabase/server';
import type { WorkflowContext } from '@/lib/workflows/types';

interface InAppNotificationParams {
	recipients: string[];
	template: string;
	context: WorkflowContext;
}

export async function sendInAppNotification({
	recipients,
	template,
	context,
}: InAppNotificationParams): Promise<void> {
	try {
		const supabase = createClient();

		// Get ticket details if ticketId is present
		let ticketDetails = null;
		if (context.ticketId) {
			const { data: ticket } = await supabase
				.from('tickets')
				.select(
					`
					*,
					user:users!tickets_user_id_fkey (
						name
					),
					assignee:users!tickets_assigned_to_fkey (
						name
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

		// Replace template variables with actual values
		const message = renderTemplate(template, {
			...context,
			ticket: ticketDetails,
		});

		// Create in-app notifications for each recipient
		const notifications = recipients.map((userId) => ({
			user_id: userId,
			type: 'workflow',
			message,
			data: JSON.parse(
				JSON.stringify({
					...context,
					ticket: ticketDetails,
				})
			),
			read: false,
		}));

		// Insert notifications
		await supabase.from('user_notifications').insert(notifications);

		// Log notification
		await supabase.from('notifications').insert({
			type: 'in_app',
			recipients,
			template,
			context: JSON.parse(
				JSON.stringify({
					...context,
					ticket: ticketDetails,
				})
			),
			status: 'sent',
		});
	} catch (error) {
		console.error('Failed to send in-app notification:', error);

		// Log failed notification
		const supabase = createClient();
		await supabase.from('notifications').insert({
			type: 'in_app',
			recipients,
			template,
			context: JSON.parse(JSON.stringify(context)),
			status: 'failed',
			error: error instanceof Error ? error.message : 'Unknown error',
		});

		throw error;
	}
}

function renderTemplate(template: string, context: Record<string, unknown>): string {
	let rendered = template;
	for (const [key, value] of Object.entries(context)) {
		const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
		rendered = rendered.replace(regex, String(value));
	}
	return rendered;
}
