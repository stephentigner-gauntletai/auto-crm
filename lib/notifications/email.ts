import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';
import type { WorkflowContext } from '@/lib/workflows/types';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailNotificationParams {
	recipients: string[];
	template: string;
	context: WorkflowContext;
}

export async function sendEmail({
	recipients,
	template,
	context,
}: EmailNotificationParams): Promise<void> {
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
						email,
						name
					),
					assignee:users!tickets_assigned_to_fkey (
						email,
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
		const renderedTemplate = renderTemplate(template, {
			...context,
			ticket: ticketDetails,
		});

		// Send email using Resend
		await resend.emails.send({
			from: 'noreply@auto-crm.com',
			to: recipients,
			subject: renderedTemplate.subject,
			html: renderedTemplate.body,
		});

		// Log notification
		await supabase.from('notifications').insert({
			type: 'email',
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
		console.error('Failed to send email notification:', error);

		// Log failed notification
		const supabase = createClient();
		await supabase.from('notifications').insert({
			type: 'email',
			recipients,
			template,
			context: JSON.parse(JSON.stringify(context)),
			status: 'failed',
			error: error instanceof Error ? error.message : 'Unknown error',
		});

		throw error;
	}
}

interface RenderedTemplate {
	subject: string;
	body: string;
}

function renderTemplate(template: string, context: Record<string, unknown>): RenderedTemplate {
	// Simple template rendering implementation
	// In a real application, you might want to use a proper template engine
	let rendered = template;
	for (const [key, value] of Object.entries(context)) {
		const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
		rendered = rendered.replace(regex, String(value));
	}

	// Extract subject from template
	// Format: ---\nsubject: Subject line\n---\nEmail body
	const [, subject, body] = rendered.match(/---\nsubject:(.*)\n---\n(.*)/s) || [
		'',
		'Notification',
		rendered,
	];

	return {
		subject: subject.trim(),
		body: body.trim(),
	};
}
