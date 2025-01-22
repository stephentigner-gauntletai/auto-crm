import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import type { Database } from '../../../../types/supabase';

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { email, password, full_name } = body;

		if (!email || !password || !full_name) {
			return NextResponse.json(
				{ error: 'Email, password, and full name are required' },
				{ status: 400 }
			);
		}

		// Validate password format
		const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
		if (!passwordRegex.test(password)) {
			return NextResponse.json(
				{
					error: 'Password must be at least 8 characters and contain uppercase, lowercase, and numbers',
				},
				{ status: 400 }
			);
		}

		const supabase = createClient<Database>(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
			{
				auth: {
					persistSession: false,
				},
			}
		);

		const { data, error } = await supabase.auth.signUp({
			email,
			password,
			options: {
				data: {
					full_name,
				},
			},
		});

		if (error) {
			if (error.message.includes('already registered')) {
				return NextResponse.json({ error: error.message }, { status: 409 });
			}
			throw error;
		}

		return NextResponse.json(data);
	} catch (err) {
		console.error('Sign up error:', err);
		return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
	}
}
