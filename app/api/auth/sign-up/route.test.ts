import { createMocks } from 'node-mocks-http';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { POST } from './route';
import { mockToNextRequest } from '../../../../test/helpers/request';

jest.mock('@supabase/supabase-js');
jest.mock('next/headers');

describe('POST /api/auth/sign-up', () => {
	const mockSupabase = {
		auth: {
			signUp: jest.fn(),
		},
	};

	beforeEach(() => {
		(createClient as jest.Mock).mockReturnValue(mockSupabase);
		(cookies as unknown as jest.Mock).mockReturnValue({
			getAll: () => [],
		});
	});

	it('creates a new user with valid data', async () => {
		const { req, res } = createMocks({
			method: 'POST',
			body: {
				email: 'test@example.com',
				password: 'Password123!',
				full_name: 'Test User',
			},
		});

		mockSupabase.auth.signUp.mockResolvedValueOnce({
			data: {
				user: { id: '123', email: 'test@example.com' },
				session: null,
			},
			error: null,
		});

		await POST(mockToNextRequest(req));

		expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
			email: 'test@example.com',
			password: 'Password123!',
			options: {
				data: {
					full_name: 'Test User',
				},
			},
		});
		expect(res._getStatusCode()).toBe(200);
		expect(JSON.parse(res._getData())).toEqual({
			user: { id: '123', email: 'test@example.com' },
			session: null,
		});
	});

	it('returns 400 for missing required fields', async () => {
		const { req, res } = createMocks({
			method: 'POST',
			body: {
				email: 'test@example.com',
				// Missing password and full_name
			},
		});

		await POST(mockToNextRequest(req));

		expect(res._getStatusCode()).toBe(400);
		expect(JSON.parse(res._getData())).toEqual({
			error: 'Email, password, and full name are required',
		});
	});

	it('returns 400 for invalid password format', async () => {
		const { req, res } = createMocks({
			method: 'POST',
			body: {
				email: 'test@example.com',
				password: 'weak', // Too short, no uppercase, no number
				full_name: 'Test User',
			},
		});

		await POST(mockToNextRequest(req));

		expect(res._getStatusCode()).toBe(400);
		expect(JSON.parse(res._getData())).toEqual({
			error: 'Password must be at least 8 characters and contain uppercase, lowercase, and numbers',
		});
	});

	it('returns 409 for existing email', async () => {
		const { req, res } = createMocks({
			method: 'POST',
			body: {
				email: 'existing@example.com',
				password: 'Password123!',
				full_name: 'Test User',
			},
		});

		mockSupabase.auth.signUp.mockResolvedValueOnce({
			data: { user: null, session: null },
			error: { message: 'User already registered' },
		});

		await POST(mockToNextRequest(req));

		expect(res._getStatusCode()).toBe(409);
		expect(JSON.parse(res._getData())).toEqual({
			error: 'User already registered',
		});
	});

	it('returns 500 for unexpected errors', async () => {
		const { req, res } = createMocks({
			method: 'POST',
			body: {
				email: 'test@example.com',
				password: 'Password123!',
				full_name: 'Test User',
			},
		});

		mockSupabase.auth.signUp.mockRejectedValueOnce(new Error('Database connection failed'));

		await POST(mockToNextRequest(req));

		expect(res._getStatusCode()).toBe(500);
		expect(JSON.parse(res._getData())).toEqual({
			error: 'An unexpected error occurred',
		});
	});
});
