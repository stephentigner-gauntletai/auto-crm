import { renderHook, act } from '@testing-library/react';
import { useSession } from './useSession';
import { createClient } from '@supabase/supabase-js';
import type { AuthChangeEvent } from '@supabase/supabase-js';

jest.mock('@supabase/supabase-js');

describe('useSession', () => {
	const mockSession = {
		access_token: 'mock-access-token',
		refresh_token: 'mock-refresh-token',
		expires_in: 3600,
		token_type: 'bearer',
		user: {
			id: '123',
			email: 'test@example.com',
			app_metadata: {},
			user_metadata: {},
			aud: 'authenticated',
			created_at: '2024-01-21T00:00:00.000Z',
			role: 'authenticated',
			updated_at: '2024-01-21T00:00:00.000Z',
		},
	};

	const mockSupabase = {
		auth: {
			getSession: jest.fn(),
			onAuthStateChange: jest.fn((callback) => {
				(mockSupabase as any).authCallback = callback;
				return {
					data: { subscription: { unsubscribe: jest.fn() } },
				};
			}),
		},
	};

	beforeEach(() => {
		(createClient as jest.Mock).mockReturnValue(mockSupabase);
		mockSupabase.auth.getSession.mockResolvedValue({
			data: { session: null },
			error: null,
		});
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('initializes with loading state and no session', async () => {
		const { result } = renderHook(() => useSession());

		expect(result.current.loading).toBe(true);
		expect(result.current.session).toBeNull();

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});

		expect(result.current.loading).toBe(false);
	});

	it('updates session when auth state changes', async () => {
		mockSupabase.auth.getSession.mockResolvedValueOnce({
			data: { session: mockSession },
			error: null,
		});

		const { result } = renderHook(() => useSession());

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});

		expect(result.current.loading).toBe(false);
		expect(result.current.session).toEqual(mockSession);
	});

	it('handles auth state change', async () => {
		const { result } = renderHook(() => useSession());

		await act(async () => {
			(mockSupabase as any).authCallback('SIGNED_IN' as AuthChangeEvent, mockSession);
		});

		expect(result.current.loading).toBe(false);
		expect(result.current.session).toEqual(mockSession);
	});

	it('cleans up auth subscription on unmount', () => {
		const unsubscribe = jest.fn();
		mockSupabase.auth.onAuthStateChange.mockReturnValueOnce({
			data: { subscription: { unsubscribe } },
		});

		const { unmount } = renderHook(() => useSession());
		unmount();

		expect(unsubscribe).toHaveBeenCalled();
	});
});
