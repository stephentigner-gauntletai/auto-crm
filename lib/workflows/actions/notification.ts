import { sendEmail } from '@/lib/notifications/email';
import { sendInAppNotification } from '@/lib/notifications/in-app';
import { sendWebhookNotification } from '@/lib/notifications/webhook';
import { createClient } from '@/lib/supabase/server';
import type { WorkflowContext } from '@/lib/workflows/types';

/**
 * Actions for sending notifications in automated workflows
 */
export const notificationActions = {
	/**
	 * Send an email notification
	 */
	async sendEmail(recipients: string[], template: string, context: WorkflowContext) {
		await sendEmail({
			recipients,
			template,
			context,
		});
	},

	/**
	 * Send an in-app notification
	 */
	async sendInAppNotification(recipients: string[], template: string, context: WorkflowContext) {
		await sendInAppNotification({
			recipients,
			template,
			context,
		});
	},

	/**
	 * Send a team notification (to all members of specified teams)
	 */
	async sendTeamNotification(teamIds: string[], template: string, context: WorkflowContext) {
		const supabase = createClient();

		// Get all team members' user IDs
		const { data: teamMembers, error } = await supabase
			.from('team_members')
			.select('user_id')
			.in('team_id', teamIds)
			.not('user_id', 'is', null);

		if (error) {
			throw new Error(`Failed to get team members: ${error.message}`);
		}

		if (!teamMembers?.length) {
			return; // No team members to notify
		}

		const userIds = teamMembers.map((member) => member.user_id as string);

		// Send in-app notification to all team members
		await sendInAppNotification({
			recipients: userIds,
			template,
			context,
		});
	},

	/**
	 * Send a webhook notification
	 */
	async sendWebhook(webhookUrl: string, template: string, context: WorkflowContext) {
		await sendWebhookNotification({
			recipients: [webhookUrl],
			template,
			context,
		});
	},
};
