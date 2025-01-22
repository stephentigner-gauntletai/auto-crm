import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/types/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
type FieldChange = {
	old: JsonValue;
	new: JsonValue;
};

// Helper type for the Supabase client
type TypedSupabaseClient = SupabaseClient<Database>;

// Create a single supabase client for interacting with your database
const createClient = () => {
	return createSupabaseClient<Database>(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			auth: {
				persistSession: false,
			},
		}
	);
};

/**
 * @swagger
 * /api/tickets:
 *   get:
 *     summary: List tickets
 *     description: Retrieve a paginated list of tickets with optional filtering
 *     tags:
 *       - Tickets
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, in_progress, resolved, closed]
 *         description: Filter tickets by status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         description: Filter tickets by priority
 *     responses:
 *       200:
 *         description: Successfully retrieved tickets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [open, in_progress, resolved, closed]
 *                       priority:
 *                         type: string
 *                         enum: [low, medium, high, urgent]
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     pageSize:
 *                       type: integer
 *                     total:
 *                       type: integer
 *       500:
 *         description: Server error
 *   post:
 *     summary: Create a ticket
 *     description: Create a new ticket in the system
 *     tags:
 *       - Tickets
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the ticket
 *               description:
 *                 type: string
 *                 description: Detailed description of the ticket
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *                 default: medium
 *               status:
 *                 type: string
 *                 enum: [open, in_progress, resolved, closed]
 *                 default: open
 *     responses:
 *       200:
 *         description: Successfully created ticket
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     status:
 *                       type: string
 *                     priority:
 *                       type: string
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       500:
 *         description: Server error
 *   put:
 *     summary: Update a ticket
 *     description: Update an existing ticket by ID
 *     tags:
 *       - Tickets
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [open, in_progress, resolved, closed]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *     responses:
 *       200:
 *         description: Successfully updated ticket
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     status:
 *                       type: string
 *                     priority:
 *                       type: string
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 *   delete:
 *     summary: Delete a ticket
 *     description: Delete a ticket by ID
 *     tags:
 *       - Tickets
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the ticket to delete
 *     responses:
 *       200:
 *         description: Successfully deleted ticket
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       400:
 *         description: Invalid request - ID is required
 *       500:
 *         description: Server error
 */

export async function GET(request: NextRequest) {
	try {
		const supabase = createClient();
		const searchParams = request.nextUrl.searchParams;

		// Parse query parameters
		const page = parseInt(searchParams.get('page') || '1');
		const pageSize = parseInt(searchParams.get('pageSize') || '10');
		const status = searchParams.get('status');
		const priority = searchParams.get('priority');
		const team_id = searchParams.get('team_id');
		const assigned_to = searchParams.get('assigned_to');
		const search = searchParams.get('search');

		// Calculate pagination
		const start = (page - 1) * pageSize;
		const end = start + pageSize - 1;

		// Build query
		let query = supabase
			.from('tickets')
			.select('*, assigned_to:users(id, full_name, email)', { count: 'exact' })
			.range(start, end);

		// Apply filters
		if (status) {
			query = query.eq('status', status);
		}
		if (priority) {
			query = query.eq('priority', priority);
		}
		if (team_id) {
			query = query.eq('team_id', team_id);
		}
		if (assigned_to) {
			query = query.eq('assigned_to', assigned_to);
		}
		if (search) {
			query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
		}

		// Execute query
		const { data: tickets, error, count } = await query;

		if (error) {
			console.error('Error fetching tickets:', error);
			return NextResponse.json(
				{
					error: {
						code: 'DATABASE_ERROR',
						message: 'Failed to fetch tickets',
					},
				},
				{ status: 500 }
			);
		}

		return NextResponse.json({
			data: tickets,
			pagination: {
				page,
				pageSize,
				total: count || 0,
			},
		});
	} catch (error) {
		console.error('Error in ticket retrieval:', error);
		return NextResponse.json(
			{
				error: {
					code: 'INTERNAL_ERROR',
					message: 'An unexpected error occurred',
				},
			},
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const supabase = createClient();
		const data = await request.json();

		// Validate required fields
		if (!data.title || !data.description || !data.team_id) {
			return NextResponse.json(
				{
					error: {
						code: 'VALIDATION_ERROR',
						message: 'Missing required fields: title, description, team_id',
					},
				},
				{ status: 400 }
			);
		}

		// Create the ticket
		const { data: ticket, error } = await supabase
			.from('tickets')
			.insert({
				title: data.title,
				description: data.description,
				status: 'open', // Default status for new tickets
				priority: data.priority || 'medium', // Default priority if not specified
				team_id: data.team_id,
				customer_id: data.customer_id,
				tags: data.tags,
				metadata: data.metadata,
			})
			.select()
			.single();

		if (error) {
			console.error('Error creating ticket:', error);
			return NextResponse.json(
				{
					error: {
						code: 'DATABASE_ERROR',
						message: 'Failed to create ticket',
					},
				},
				{ status: 500 }
			);
		}

		// Create ticket history entry
		await supabase.from('ticket_history').insert({
			ticket_id: ticket.id,
			action: 'create',
			details: {
				status: 'open',
				priority: data.priority || 'medium',
			},
		});

		return NextResponse.json({ data: ticket }, { status: 201 });
	} catch (error) {
		console.error('Error in ticket creation:', error);
		return NextResponse.json(
			{
				error: {
					code: 'INTERNAL_ERROR',
					message: 'An unexpected error occurred',
				},
			},
			{ status: 500 }
		);
	}
}

export async function PUT(request: NextRequest) {
	try {
		const supabase = createClient();
		const data = await request.json();

		// Validate ticket ID
		if (!data.id) {
			return NextResponse.json(
				{
					error: {
						code: 'VALIDATION_ERROR',
						message: 'Ticket ID is required',
					},
				},
				{ status: 400 }
			);
		}

		// Get current ticket state for history
		const { data: currentTicket } = await supabase
			.from('tickets')
			.select('*')
			.eq('id', data.id)
			.single();

		if (!currentTicket) {
			return NextResponse.json(
				{
					error: {
						code: 'NOT_FOUND',
						message: 'Ticket not found',
					},
				},
				{ status: 404 }
			);
		}

		// Prepare update data
		const updateData: Database['public']['Tables']['tickets']['Update'] = {};
		const changedFields: Record<string, FieldChange> = {};

		// Check each field for changes
		if (data.title && data.title !== currentTicket.title) {
			updateData.title = data.title;
			changedFields.title = { old: currentTicket.title, new: data.title };
		}
		if (data.description && data.description !== currentTicket.description) {
			updateData.description = data.description;
			changedFields.description = { old: currentTicket.description, new: data.description };
		}
		if (data.status && data.status !== currentTicket.status) {
			updateData.status = data.status;
			changedFields.status = { old: currentTicket.status, new: data.status };
		}
		if (data.priority && data.priority !== currentTicket.priority) {
			updateData.priority = data.priority;
			changedFields.priority = { old: currentTicket.priority, new: data.priority };
		}
		if (data.assigned_to && data.assigned_to !== currentTicket.assigned_to) {
			updateData.assigned_to = data.assigned_to;
			changedFields.assigned_to = { old: currentTicket.assigned_to, new: data.assigned_to };
		}
		if (data.team_id && data.team_id !== currentTicket.team_id) {
			updateData.team_id = data.team_id;
			changedFields.team_id = { old: currentTicket.team_id, new: data.team_id };
		}

		// Update the ticket
		const { data: updatedTicket, error: updateError } = await supabase
			.from('tickets')
			.update(updateData)
			.eq('id', data.id)
			.select()
			.single();

		if (updateError) {
			console.error('Error updating ticket:', updateError);
			return NextResponse.json(
				{
					error: {
						code: 'DATABASE_ERROR',
						message: 'Failed to update ticket',
					},
				},
				{ status: 500 }
			);
		}

		// Handle tags update
		if (data.tags) {
			// Delete existing tags
			await supabase
				.from('ticket_metadata')
				.delete()
				.eq('ticket_id', data.id)
				.eq('key', 'tag');

			// Insert new tags
			if (data.tags.length > 0) {
				const tagInserts = data.tags.map((tag: string) => ({
					ticket_id: data.id,
					key: 'tag',
					value: tag,
				}));
				await supabase.from('ticket_metadata').insert(tagInserts);
			}

			changedFields.tags = {
				old: await getTicketTags(supabase, data.id),
				new: data.tags,
			};
		}

		// Handle metadata update
		if (data.metadata) {
			for (const [key, value] of Object.entries(data.metadata)) {
				await supabase.from('ticket_metadata').upsert(
					{
						ticket_id: data.id,
						key,
						value: JSON.stringify(value),
					},
					{ onConflict: 'ticket_id,key' }
				);
			}

			changedFields.metadata = {
				old: await getTicketMetadata(supabase, data.id),
				new: data.metadata,
			};
		}

		// Create history entries for each changed field
		for (const [field, changes] of Object.entries(changedFields)) {
			await supabase.from('ticket_history').insert({
				ticket_id: data.id,
				action: 'update',
				details: {
					field,
					old_value: changes.old,
					new_value: changes.new,
				},
			});
		}

		// Get the final ticket state with metadata
		const finalTicket = {
			...updatedTicket,
			tags: await getTicketTags(supabase, data.id),
			metadata: await getTicketMetadata(supabase, data.id),
		};

		return NextResponse.json({ data: finalTicket });
	} catch (error) {
		console.error('Error in ticket update:', error);
		return NextResponse.json(
			{
				error: {
					code: 'INTERNAL_ERROR',
					message: 'An unexpected error occurred',
				},
			},
			{ status: 500 }
		);
	}
}

async function getTicketTags(supabase: TypedSupabaseClient, ticketId: string) {
	const { data } = await supabase
		.from('ticket_metadata')
		.select('value')
		.eq('ticket_id', ticketId)
		.eq('key', 'tag');
	return data?.map((row) => row.value) || [];
}

async function getTicketMetadata(supabase: TypedSupabaseClient, ticketId: string) {
	const { data } = await supabase
		.from('ticket_metadata')
		.select('key, value')
		.eq('ticket_id', ticketId)
		.neq('key', 'tag');

	const metadata: Record<string, JsonValue> = {};
	data?.forEach((row) => {
		if (row.key) {
			try {
				metadata[row.key] = JSON.parse(row.value || '');
			} catch {
				metadata[row.key] = row.value;
			}
		}
	});
	return metadata;
}

export async function DELETE(request: NextRequest) {
	try {
		const supabase = createClient();
		const searchParams = request.nextUrl.searchParams;
		const id = searchParams.get('id');

		if (!id) {
			return NextResponse.json(
				{
					error: {
						code: 'VALIDATION_ERROR',
						message: 'Ticket ID is required',
					},
				},
				{ status: 400 }
			);
		}

		// Get current ticket state for history
		const { data: currentTicket } = await supabase
			.from('tickets')
			.select('*')
			.eq('id', id)
			.single();

		if (!currentTicket) {
			return NextResponse.json(
				{
					error: {
						code: 'NOT_FOUND',
						message: 'Ticket not found',
					},
				},
				{ status: 404 }
			);
		}

		// Soft delete by updating status and adding metadata
		const { error: updateError } = await supabase
			.from('tickets')
			.update({
				status: 'deleted',
				updated_at: new Date().toISOString(),
			})
			.eq('id', id);

		if (updateError) {
			console.error('Error deleting ticket:', updateError);
			return NextResponse.json(
				{
					error: {
						code: 'DATABASE_ERROR',
						message: 'Failed to delete ticket',
					},
				},
				{ status: 500 }
			);
		}

		// Add deletion metadata
		await supabase.from('ticket_metadata').insert({
			ticket_id: id,
			key: 'deleted_at',
			value: new Date().toISOString(),
		});

		// Add history entry
		await supabase.from('ticket_history').insert({
			ticket_id: id,
			action: 'delete',
			details: {
				status: 'deleted',
				previous_status: currentTicket.status,
			},
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Error in ticket deletion:', error);
		return NextResponse.json(
			{
				error: {
					code: 'INTERNAL_ERROR',
					message: 'An unexpected error occurred',
				},
			},
			{ status: 500 }
		);
	}
}
