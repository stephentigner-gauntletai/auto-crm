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
