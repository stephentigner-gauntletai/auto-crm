import { renderHook, act } from '@testing-library/react';
import { useUser } from './useUser';
import { createClient } from '@supabase/supabase-js';
import type { AuthChangeEvent } from '@supabase/supabase-js';

jest.mock('@supabase/supabase-js');

describe('useUser', () => {
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

	it('initializes with loading state and no user', async () => {
		const { result } = renderHook(() => useUser());

		expect(result.current.loading).toBe(true);
		expect(result.current.user).toBeNull();

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});

		expect(result.current.loading).toBe(false);
	});

	it('updates user when session changes', async () => {
		mockSupabase.auth.getSession.mockResolvedValueOnce({
			data: { session: mockSession },
			error: null,
		});

		const { result } = renderHook(() => useUser());

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});

		expect(result.current.loading).toBe(false);
		expect(result.current.user).toEqual(mockSession.user);
	});

	it('handles auth state change', async () => {
		const { result } = renderHook(() => useUser());

		await act(async () => {
			(mockSupabase as any).authCallback('SIGNED_IN' as AuthChangeEvent, mockSession);
		});

		expect(result.current.loading).toBe(false);
		expect(result.current.user).toEqual(mockSession.user);
	});

	it('cleans up auth subscription on unmount', () => {
		const unsubscribe = jest.fn();
		mockSupabase.auth.onAuthStateChange.mockReturnValueOnce({
			data: { subscription: { unsubscribe } },
		});

		const { unmount } = renderHook(() => useUser());
		unmount();

		expect(unsubscribe).toHaveBeenCalled();
	});
});
