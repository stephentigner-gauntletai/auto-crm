import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import type { Database } from '../../../types/supabase';

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: List users
 *     description: Retrieve a list of users with optional role filtering
 *     tags:
 *       - Users
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, agent, customer]
 *         description: Filter users by role
 *       - in: query
 *         name: team_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter users by team membership
 *     responses:
 *       200:
 *         description: Successfully retrieved users
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
 *                       email:
 *                         type: string
 *                         format: email
 *                       full_name:
 *                         type: string
 *                       role:
 *                         type: string
 *                         enum: [admin, agent, customer]
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       last_sign_in:
 *                         type: string
 *                         format: date-time
 *       500:
 *         description: Server error
 *   put:
 *     summary: Update a user
 *     description: Update an existing user's profile or role
 *     tags:
 *       - Users
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
 *               full_name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, agent, customer]
 *     responses:
 *       200:
 *         description: Successfully updated user
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
 *                     email:
 *                       type: string
 *                       format: email
 *                     full_name:
 *                       type: string
 *                     role:
 *                       type: string
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid request
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Server error
 *   delete:
 *     summary: Delete a user
 *     description: Delete a user and their associated data (requires admin privileges)
 *     tags:
 *       - Users
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the user to delete
 *     responses:
 *       200:
 *         description: Successfully deleted user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       400:
 *         description: Invalid request - ID is required
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Server error
 */

interface UserMetadata {
	full_name?: string;
	avatar_url?: string;
	role?: string;
}

type AllowedField = keyof UserMetadata;
const allowedFields: AllowedField[] = ['full_name', 'avatar_url', 'role'];

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
		const role = searchParams.get('role');
		const teamId = searchParams.get('team_id');

		// Get users through auth API
		const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
		if (usersError) throw usersError;

		let filteredUsers = users.users;

		// Apply role filter if specified
		if (role) {
			filteredUsers = filteredUsers.filter((user) => user.user_metadata?.role === role);
		}

		// Apply team filter if specified
		if (teamId) {
			const { data: teamMembers, error: teamError } = await supabase
				.from('team_members')
				.select('user_id')
				.eq('team_id', teamId);

			if (teamError) throw teamError;

			const teamUserIds = teamMembers.map((tm) => tm.user_id);
			filteredUsers = filteredUsers.filter((user) => teamUserIds.includes(user.id));
		}

		return NextResponse.json({ data: filteredUsers });
	} catch (err) {
		console.error('Error in GET /api/users:', err);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function PUT(request: NextRequest) {
	try {
		const supabase = createClient();
		const json = await request.json();
		const id = json.id;
		delete json.id;

		// Only allow updating certain fields
		const metadata = Object.keys(json)
			.filter((key): key is AllowedField => allowedFields.includes(key as AllowedField))
			.reduce<UserMetadata>((obj, key) => {
				obj[key] = json[key];
				return obj;
			}, {});

		const { data, error } = await supabase.auth.admin.updateUserById(id, {
			user_metadata: metadata,
		});

		if (error) throw error;

		return NextResponse.json({ data });
	} catch (err) {
		console.error('Error in PUT /api/users:', err);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

// Note: DELETE is not implemented as users should be deactivated rather than deleted
// This preserves referential integrity and audit history
