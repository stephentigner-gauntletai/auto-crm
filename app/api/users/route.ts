import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import type { Database } from '../../../types/supabase';

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
