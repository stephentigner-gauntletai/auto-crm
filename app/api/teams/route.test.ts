import { createMocks } from 'node-mocks-http';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { GET, POST, PUT, DELETE } from './route';
import { mockToNextRequest } from '../../../test/helpers/request';

jest.mock('@supabase/supabase-js');
jest.mock('next/headers');

describe('Teams API', () => {
	const mockSupabase = {
		from: jest.fn(() => ({
			select: jest.fn().mockReturnThis(),
			insert: jest.fn().mockReturnThis(),
			update: jest.fn().mockReturnThis(),
			delete: jest.fn().mockReturnThis(),
			eq: jest.fn().mockReturnThis(),
			order: jest.fn().mockReturnThis(),
			single: jest.fn().mockReturnThis(),
		})),
	};

	beforeEach(() => {
		(createClient as jest.Mock).mockReturnValue(mockSupabase);
		(cookies as unknown as jest.Mock).mockReturnValue({
			getAll: () => [],
		});
	});

	describe('GET /api/teams', () => {
		it('returns a list of teams', async () => {
			const { req, res } = createMocks({
				method: 'GET',
			});

			const mockTeams = [
				{ id: '1', name: 'Team 1', description: 'First team' },
				{ id: '2', name: 'Team 2', description: 'Second team' },
			];

			mockSupabase.from().select().mockResolvedValueOnce({
				data: mockTeams,
				error: null,
			});

			await GET(mockToNextRequest(req));

			expect(mockSupabase.from).toHaveBeenCalledWith('teams');
			expect(res._getStatusCode()).toBe(200);
			expect(JSON.parse(res._getData())).toEqual(mockTeams);
		});

		it('includes team members when requested', async () => {
			const { req } = createMocks({
				method: 'GET',
				query: {
					include_members: 'true',
				},
			});

			await GET(mockToNextRequest(req));

			expect(mockSupabase.from().select).toHaveBeenCalledWith('*, members:team_members(*)');
		});
	});

	describe('POST /api/teams', () => {
		it('creates a new team with valid data', async () => {
			const teamData = {
				name: 'New Team',
				description: 'A new support team',
			};

			const { req, res } = createMocks({
				method: 'POST',
				body: teamData,
			});

			const mockTeam = { id: '1', ...teamData };
			mockSupabase.from().insert().single().mockResolvedValueOnce({
				data: mockTeam,
				error: null,
			});

			await POST(mockToNextRequest(req));

			expect(mockSupabase.from).toHaveBeenCalledWith('teams');
			expect(mockSupabase.from().insert).toHaveBeenCalledWith(teamData);
			expect(res._getStatusCode()).toBe(201);
			expect(JSON.parse(res._getData())).toEqual(mockTeam);
		});

		it('returns 400 for missing required fields', async () => {
			const { req, res } = createMocks({
				method: 'POST',
				body: {
					description: 'Missing name',
				},
			});

			await POST(mockToNextRequest(req));

			expect(res._getStatusCode()).toBe(400);
			expect(JSON.parse(res._getData())).toEqual({
				error: 'Team name is required',
			});
		});
	});

	describe('PUT /api/teams', () => {
		it('updates a team with valid data', async () => {
			const updateData = {
				name: 'Updated Team Name',
				description: 'Updated description',
			};

			const { req, res } = createMocks({
				method: 'PUT',
				body: { id: '1', ...updateData },
			});

			const mockUpdatedTeam = { id: '1', ...updateData };
			mockSupabase.from().update().eq().single().mockResolvedValueOnce({
				data: mockUpdatedTeam,
				error: null,
			});

			await PUT(mockToNextRequest(req));

			expect(mockSupabase.from).toHaveBeenCalledWith('teams');
			expect(mockSupabase.from().update).toHaveBeenCalledWith(updateData);
			expect(mockSupabase.from().update().eq).toHaveBeenCalledWith('id', '1');
			expect(res._getStatusCode()).toBe(200);
		});

		it('returns 404 for non-existent team', async () => {
			const { req, res } = createMocks({
				method: 'PUT',
				body: {
					id: '999',
					name: 'Not Found Team',
				},
			});

			mockSupabase
				.from()
				.update()
				.eq()
				.single()
				.mockResolvedValueOnce({
					data: null,
					error: { message: 'Team not found' },
				});

			await PUT(mockToNextRequest(req));

			expect(res._getStatusCode()).toBe(404);
			expect(JSON.parse(res._getData())).toEqual({
				error: 'Team not found',
			});
		});
	});

	describe('DELETE /api/teams', () => {
		it('deletes a team successfully', async () => {
			const { req, res } = createMocks({
				method: 'DELETE',
				query: {
					id: '1',
				},
			});

			mockSupabase
				.from()
				.delete()
				.eq()
				.mockResolvedValueOnce({
					data: { id: '1' },
					error: null,
				});

			await DELETE(mockToNextRequest(req));

			expect(mockSupabase.from).toHaveBeenCalledWith('teams');
			expect(mockSupabase.from().delete().eq).toHaveBeenCalledWith('id', '1');
			expect(res._getStatusCode()).toBe(200);
		});

		it('returns 404 for non-existent team', async () => {
			const { req, res } = createMocks({
				method: 'DELETE',
				query: {
					id: '999',
				},
			});

			mockSupabase
				.from()
				.delete()
				.eq()
				.mockResolvedValueOnce({
					data: null,
					error: { message: 'Team not found' },
				});

			await DELETE(mockToNextRequest(req));

			expect(res._getStatusCode()).toBe(404);
			expect(JSON.parse(res._getData())).toEqual({
				error: 'Team not found',
			});
		});
	});
});
