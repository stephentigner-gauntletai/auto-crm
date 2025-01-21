import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from './types/supabase';

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

export async function middleware(request: NextRequest) {
	const res = NextResponse.next();
	const supabase = createClient();

	// Get the authorization header
	const authHeader = request.headers.get('authorization');
	if (!authHeader?.startsWith('Bearer ')) {
		return NextResponse.json(
			{ error: 'Missing or invalid authorization header' },
			{ status: 401 }
		);
	}

	// Verify the JWT token
	const token = authHeader.split(' ')[1];
	const {
		data: { user },
		error,
	} = await supabase.auth.getUser(token);

	if (error || !user) {
		return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
	}

	// Protected routes that require authentication
	const protectedRoutes = ['/api/tickets', '/api/users', '/api/teams'];
	const isProtectedRoute = protectedRoutes.some((route) =>
		request.nextUrl.pathname.startsWith(route)
	);

	if (isProtectedRoute && !user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	return res;
}

// Configure middleware to run on specific paths
export const config = {
	matcher: ['/api/tickets/:path*', '/api/users/:path*', '/api/teams/:path*'],
};
