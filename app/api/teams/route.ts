import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import type { Database } from '../../../types/supabase';

/**
 * @swagger
 * /api/teams:
 *   get:
 *     summary: List teams
 *     description: Retrieve a list of teams with optional member details
 *     tags:
 *       - Teams
 *     parameters:
 *       - in: query
 *         name: include_members
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include team member details in the response
 *     responses:
 *       200:
 *         description: Successfully retrieved teams
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
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       team_members:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             user_id:
 *                               type: string
 *                               format: uuid
 *                             role:
 *                               type: string
 *                               enum: [member, leader]
 *       500:
 *         description: Server error
 *   post:
 *     summary: Create a team
 *     description: Create a new team in the system
 *     tags:
 *       - Teams
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the team
 *               description:
 *                 type: string
 *                 description: Description of the team
 *     responses:
 *       200:
 *         description: Successfully created team
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
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       500:
 *         description: Server error
 *   put:
 *     summary: Update a team
 *     description: Update an existing team by ID
 *     tags:
 *       - Teams
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully updated team
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
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 *   delete:
 *     summary: Delete a team
 *     description: Delete a team and all its members by ID
 *     tags:
 *       - Teams
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the team to delete
 *     responses:
 *       200:
 *         description: Successfully deleted team
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
		const includeMembers = searchParams.get('include_members') === 'true';

		const query = supabase
			.from('teams')
			.select(includeMembers ? `*, team_members(user_id, role)` : '*');

		const { data, error } = await query;

		if (error) throw error;

		return NextResponse.json({ data });
	} catch (err) {
		console.error('Error in GET /api/teams:', err);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function POST(request: NextRequest) {
	try {
		const supabase = createClient();
		const json = await request.json();

		const { data, error } = await supabase.from('teams').insert([json]).select().single();

		if (error) throw error;

		return NextResponse.json({ data });
	} catch (err) {
		console.error('Error in POST /api/teams:', err);
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
			.from('teams')
			.update(json)
			.eq('id', id)
			.select()
			.single();

		if (error) throw error;

		return NextResponse.json({ data });
	} catch (err) {
		console.error('Error in PUT /api/teams:', err);
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

		// First delete team members
		await supabase.from('team_members').delete().eq('team_id', id);

		// Then delete the team
		const { error } = await supabase.from('teams').delete().eq('id', id);

		if (error) throw error;

		return NextResponse.json({ success: true });
	} catch (err) {
		console.error('Error in DELETE /api/teams:', err);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
