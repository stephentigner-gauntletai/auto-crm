import { createMocks } from 'node-mocks-http';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { POST } from './route';
import { mockToNextRequest } from '../../../../test/helpers/request';

jest.mock('@supabase/supabase-js');
jest.mock('next/headers');

describe('POST /api/auth/sign-in', () => {
	const mockSupabase = {
		auth: {
			signInWithPassword: jest.fn(),
		},
	};

	beforeEach(() => {
		(createClient as jest.Mock).mockReturnValue(mockSupabase);
		(cookies as unknown as jest.Mock).mockReturnValue({
			getAll: () => [],
		});
	});

	it('signs in a user with valid credentials', async () => {
		const { req, res } = createMocks({
			method: 'POST',
			body: {
				email: 'test@example.com',
				password: 'password123',
			},
		});

		mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
			data: {
				user: { id: '123', email: 'test@example.com' },
				session: { access_token: 'token123' },
			},
			error: null,
		});

		await POST(mockToNextRequest(req));

		expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
			email: 'test@example.com',
			password: 'password123',
		});
		expect(res._getStatusCode()).toBe(200);
		expect(JSON.parse(res._getData())).toEqual({
			user: { id: '123', email: 'test@example.com' },
			session: { access_token: 'token123' },
		});
	});

	it('returns 400 for missing credentials', async () => {
		const { req, res } = createMocks({
			method: 'POST',
			body: {},
		});

		await POST(mockToNextRequest(req));

		expect(res._getStatusCode()).toBe(400);
		expect(JSON.parse(res._getData())).toEqual({
			error: 'Email and password are required',
		});
	});

	it('returns 401 for invalid credentials', async () => {
		const { req, res } = createMocks({
			method: 'POST',
			body: {
				email: 'test@example.com',
				password: 'wrongpassword',
			},
		});

		mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
			data: { user: null, session: null },
			error: { message: 'Invalid login credentials' },
		});

		await POST(mockToNextRequest(req));

		expect(res._getStatusCode()).toBe(401);
		expect(JSON.parse(res._getData())).toEqual({
			error: 'Invalid login credentials',
		});
	});

	it('returns 500 for unexpected errors', async () => {
		const { req, res } = createMocks({
			method: 'POST',
			body: {
				email: 'test@example.com',
				password: 'password123',
			},
		});

		mockSupabase.auth.signInWithPassword.mockRejectedValueOnce(
			new Error('Database connection failed')
		);

		await POST(mockToNextRequest(req));

		expect(res._getStatusCode()).toBe(500);
		expect(JSON.parse(res._getData())).toEqual({
			error: 'An unexpected error occurred',
		});
	});
});
