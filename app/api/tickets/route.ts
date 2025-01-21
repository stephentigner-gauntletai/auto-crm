import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import type { Database } from '../../../types/supabase';

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

export async function GET(request: NextRequest) {
	try {
		const supabase = createClient();
		const searchParams = request.nextUrl.searchParams;
		const page = parseInt(searchParams.get('page') || '1');
		const limit = parseInt(searchParams.get('limit') || '10');
		const status = searchParams.get('status');
		const priority = searchParams.get('priority');

		let query = supabase.from('tickets').select('*', { count: 'exact' });

		if (status) {
			query = query.eq('status', status);
		}
		if (priority) {
			query = query.eq('priority', priority);
		}

		const { data, error, count } = await query
			.range((page - 1) * limit, page * limit - 1)
			.order('created_at', { ascending: false });

		if (error) throw error;

		return NextResponse.json({
			data,
			pagination: {
				page,
				pageSize: limit,
				total: count || 0,
			},
		});
	} catch (err) {
		console.error('Error in GET /api/tickets:', err);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function POST(request: NextRequest) {
	try {
		const supabase = createClient();
		const json = await request.json();

		const { data, error } = await supabase.from('tickets').insert([json]).select().single();

		if (error) throw error;

		return NextResponse.json({ data });
	} catch (err) {
		console.error('Error in POST /api/tickets:', err);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function PUT(request: NextRequest) {
	try {
		const supabase = createClient();
		const json = await request.json();
		const id = json.id;
		delete json.id;

		const { data, error } = await supabase
			.from('tickets')
			.update(json)
			.eq('id', id)
			.select()
			.single();

		if (error) throw error;

		return NextResponse.json({ data });
	} catch (err) {
		console.error('Error in PUT /api/tickets:', err);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function DELETE(request: NextRequest) {
	try {
		const supabase = createClient();
		const id = request.nextUrl.searchParams.get('id');

		if (!id) {
			return NextResponse.json({ error: 'ID is required' }, { status: 400 });
		}

		const { error } = await supabase.from('tickets').delete().eq('id', id);

		if (error) throw error;

		return NextResponse.json({ success: true });
	} catch (err) {
		console.error('Error in DELETE /api/tickets:', err);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
