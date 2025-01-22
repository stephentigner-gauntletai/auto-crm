import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * @swagger
 * /api/tickets/{ticketId}/messages:
 *   get:
 *     summary: Get messages for a ticket
 *     parameters:
 *       - name: ticketId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of messages for the ticket
 *   post:
 *     summary: Create a new message for a ticket
 *     parameters:
 *       - name: ticketId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message created successfully
 */

export async function GET(req: Request, { params }: { params: { ticketId: string } }) {
	const supabase = createRouteHandlerClient({ cookies });

	try {
		const { data: messages, error } = await supabase
			.from('conversations')
			.select(
				`
				id,
				message as content,
				created_at,
				user:user_id (
					id,
					full_name,
					avatar_url
				)
			`
			)
			.eq('ticket_id', params.ticketId)
			.order('created_at', { ascending: true });

		if (error) throw error;

		return NextResponse.json(messages);
	} catch (error) {
		console.error('Error fetching messages:', error);
		return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
	}
}

export async function POST(req: Request, { params }: { params: { ticketId: string } }) {
	const supabase = createRouteHandlerClient({ cookies });
	const data = await req.json();

	try {
		// Get the current user
		const {
			data: { user },
			error: userError,
		} = await supabase.auth.getUser();
		if (userError) throw userError;
		if (!user) {
			return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
		}

		// Validate required fields
		if (!data.content?.trim()) {
			return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
		}

		// Create the message
		const { data: message, error } = await supabase
			.from('conversations')
			.insert({
				ticket_id: params.ticketId,
				user_id: user.id,
				message: data.content.trim(),
			})
			.select(
				`
				id,
				message as content,
				created_at,
				user:user_id (
					id,
					full_name,
					avatar_url
				)
			`
			)
			.single();

		if (error) throw error;

		// Update ticket's updated_at timestamp
		await supabase
			.from('tickets')
			.update({ updated_at: new Date().toISOString() })
			.eq('id', params.ticketId);

		return NextResponse.json(message, { status: 201 });
	} catch (error) {
		console.error('Error creating message:', error);
		return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
	}
}
