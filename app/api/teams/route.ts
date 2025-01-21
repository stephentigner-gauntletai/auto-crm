import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import type { Database } from '../../../types/supabase';

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
