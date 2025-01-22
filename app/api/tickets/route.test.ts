import { createMocks } from 'node-mocks-http';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { GET, POST, PUT, DELETE } from './route';
import { mockToNextRequest } from '../../../test/helpers/request';

jest.mock('@supabase/supabase-js');
jest.mock('next/headers');

describe('Tickets API', () => {
	const mockSupabase = {
		from: jest.fn(() => ({
			select: jest.fn().mockReturnThis(),
			insert: jest.fn().mockReturnThis(),
			update: jest.fn().mockReturnThis(),
			delete: jest.fn().mockReturnThis(),
			eq: jest.fn().mockReturnThis(),
			order: jest.fn().mockReturnThis(),
			range: jest.fn().mockReturnThis(),
			single: jest.fn().mockReturnThis(),
		})),
	};

	beforeEach(() => {
		(createClient as jest.Mock).mockReturnValue(mockSupabase);
		(cookies as unknown as jest.Mock).mockReturnValue({
			getAll: () => [],
		});
	});

	describe('GET /api/tickets', () => {
		it('returns a list of tickets with pagination', async () => {
			const { req, res } = createMocks({
				method: 'GET',
				query: {
					page: '1',
					limit: '10',
				},
			});

			const mockTickets = [
				{ id: '1', title: 'Test Ticket 1' },
				{ id: '2', title: 'Test Ticket 2' },
			];

			mockSupabase.from().select().mockResolvedValueOnce({
				data: mockTickets,
				count: 2,
				error: null,
			});

			await GET(mockToNextRequest(req));

			expect(mockSupabase.from).toHaveBeenCalledWith('tickets');
			expect(res._getStatusCode()).toBe(200);
			expect(JSON.parse(res._getData())).toEqual({
				tickets: mockTickets,
				total: 2,
				page: 1,
				limit: 10,
			});
		});

		it('handles filtering by status and priority', async () => {
			const { req } = createMocks({
				method: 'GET',
				query: {
					status: 'open',
					priority: 'high',
				},
			});

			await GET(mockToNextRequest(req));

			expect(mockSupabase.from().select().eq).toHaveBeenCalledWith('status', 'open');
			expect(mockSupabase.from().select().eq).toHaveBeenCalledWith('priority', 'high');
		});
	});

	describe('POST /api/tickets', () => {
		it('creates a new ticket with valid data', async () => {
			const ticketData = {
				title: 'New Issue',
				description: 'Test description',
				priority: 'medium',
			};

			const { req, res } = createMocks({
				method: 'POST',
				body: ticketData,
			});

			const mockTicket = { id: '1', ...ticketData };
			mockSupabase.from().insert().single().mockResolvedValueOnce({
				data: mockTicket,
				error: null,
			});

			await POST(mockToNextRequest(req));

			expect(mockSupabase.from).toHaveBeenCalledWith('tickets');
			expect(mockSupabase.from().insert).toHaveBeenCalledWith(ticketData);
			expect(res._getStatusCode()).toBe(201);
			expect(JSON.parse(res._getData())).toEqual(mockTicket);
		});

		it('returns 400 for missing required fields', async () => {
			const { req, res } = createMocks({
				method: 'POST',
				body: {
					description: 'Missing title',
				},
			});

			await POST(mockToNextRequest(req));

			expect(res._getStatusCode()).toBe(400);
			expect(JSON.parse(res._getData())).toEqual({
				error: 'Title is required',
			});
		});
	});

	describe('PUT /api/tickets', () => {
		it('updates a ticket with valid data', async () => {
			const updateData = {
				title: 'Updated Title',
				status: 'closed',
			};

			const { req, res } = createMocks({
				method: 'PUT',
				body: { id: '1', ...updateData },
			});

			const mockUpdatedTicket = { id: '1', ...updateData };
			mockSupabase.from().update().eq().single().mockResolvedValueOnce({
				data: mockUpdatedTicket,
				error: null,
			});

			await PUT(mockToNextRequest(req));

			expect(mockSupabase.from).toHaveBeenCalledWith('tickets');
			expect(mockSupabase.from().update).toHaveBeenCalledWith(updateData);
			expect(mockSupabase.from().update().eq).toHaveBeenCalledWith('id', '1');
			expect(res._getStatusCode()).toBe(200);
		});

		it('returns 404 for non-existent ticket', async () => {
			const { req, res } = createMocks({
				method: 'PUT',
				body: {
					id: '999',
					title: 'Not Found',
				},
			});

			mockSupabase
				.from()
				.update()
				.eq()
				.single()
				.mockResolvedValueOnce({
					data: null,
					error: { message: 'Ticket not found' },
				});

			await PUT(mockToNextRequest(req));

			expect(res._getStatusCode()).toBe(404);
			expect(JSON.parse(res._getData())).toEqual({
				error: 'Ticket not found',
			});
		});
	});

	describe('DELETE /api/tickets', () => {
		it('deletes a ticket successfully', async () => {
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

			expect(mockSupabase.from).toHaveBeenCalledWith('tickets');
			expect(mockSupabase.from().delete().eq).toHaveBeenCalledWith('id', '1');
			expect(res._getStatusCode()).toBe(200);
		});

		it('returns 404 for non-existent ticket', async () => {
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
					error: { message: 'Ticket not found' },
				});

			await DELETE(mockToNextRequest(req));

			expect(res._getStatusCode()).toBe(404);
			expect(JSON.parse(res._getData())).toEqual({
				error: 'Ticket not found',
			});
		});
	});
});
