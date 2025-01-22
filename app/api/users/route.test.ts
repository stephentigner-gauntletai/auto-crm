import { createMocks } from 'node-mocks-http';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { GET, PUT } from './route';
import { mockToNextRequest } from '../../../test/helpers/request';

jest.mock('@supabase/supabase-js');
jest.mock('next/headers');

describe('Users API', () => {
	const mockSupabase = {
		from: jest.fn(() => ({
			select: jest.fn().mockReturnThis(),
			update: jest.fn().mockReturnThis(),
			eq: jest.fn().mockReturnThis(),
			in: jest.fn().mockReturnThis(),
			order: jest.fn().mockReturnThis(),
		})),
	};

	beforeEach(() => {
		(createClient as jest.Mock).mockReturnValue(mockSupabase);
		(cookies as unknown as jest.Mock).mockReturnValue({
			getAll: () => [],
		});
	});

	describe('GET /api/users', () => {
		it('returns a list of users', async () => {
			const { req, res } = createMocks({
				method: 'GET',
			});

			const mockUsers = [
				{ id: '1', email: 'user1@example.com', full_name: 'User One', role: 'agent' },
				{ id: '2', email: 'user2@example.com', full_name: 'User Two', role: 'customer' },
			];

			mockSupabase.from().select().mockResolvedValueOnce({
				data: mockUsers,
				error: null,
			});

			await GET(mockToNextRequest(req));

			expect(mockSupabase.from).toHaveBeenCalledWith('users');
			expect(res._getStatusCode()).toBe(200);
			expect(JSON.parse(res._getData())).toEqual(mockUsers);
		});

		it('filters users by role', async () => {
			const { req } = createMocks({
				method: 'GET',
				query: {
					role: 'agent',
				},
			});

			await GET(mockToNextRequest(req));

			expect(mockSupabase.from().select().eq).toHaveBeenCalledWith('role', 'agent');
		});

		it('filters users by team membership', async () => {
			const { req } = createMocks({
				method: 'GET',
				query: {
					team_id: '123',
				},
			});

			await GET(mockToNextRequest(req));

			expect(mockSupabase.from).toHaveBeenCalledWith('team_members');
			expect(mockSupabase.from().select().eq).toHaveBeenCalledWith('team_id', '123');
		});
	});

	describe('PUT /api/users', () => {
		it('updates a user profile with valid data', async () => {
			const updateData = {
				full_name: 'Updated Name',
				role: 'agent',
			};

			const { req, res } = createMocks({
				method: 'PUT',
				body: { id: '1', ...updateData },
			});

			const mockUpdatedUser = { id: '1', ...updateData };
			mockSupabase.from().update().eq().mockResolvedValueOnce({
				data: mockUpdatedUser,
				error: null,
			});

			await PUT(mockToNextRequest(req));

			expect(mockSupabase.from).toHaveBeenCalledWith('users');
			expect(mockSupabase.from().update).toHaveBeenCalledWith(updateData);
			expect(mockSupabase.from().update().eq).toHaveBeenCalledWith('id', '1');
			expect(res._getStatusCode()).toBe(200);
		});

		it('returns 400 for invalid role', async () => {
			const { req, res } = createMocks({
				method: 'PUT',
				body: {
					id: '1',
					role: 'invalid_role',
				},
			});

			await PUT(mockToNextRequest(req));

			expect(res._getStatusCode()).toBe(400);
			expect(JSON.parse(res._getData())).toEqual({
				error: 'Invalid role specified',
			});
		});

		it('returns 403 for unauthorized role change', async () => {
			const { req, res } = createMocks({
				method: 'PUT',
				body: {
					id: '1',
					role: 'admin',
				},
			});

			await PUT(mockToNextRequest(req));

			expect(res._getStatusCode()).toBe(403);
			expect(JSON.parse(res._getData())).toEqual({
				error: 'Unauthorized to change user role to admin',
			});
		});
	});
});
