import { renderHook, act } from '@testing-library/react';
import { useUser } from './useUser';
import { createClient, AuthChangeEvent, Session } from '@supabase/supabase-js';

jest.mock('@supabase/supabase-js');

type AuthStateCallback = (event: AuthChangeEvent, session: Session | null) => void;

describe('useUser', () => {
	let authStateCallback: AuthStateCallback;

	const mockSupabase = {
		auth: {
			getSession: jest.fn(),
			onAuthStateChange: jest.fn((callback: AuthStateCallback) => {
				authStateCallback = callback;
				return { data: { subscription: { unsubscribe: jest.fn() } } };
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

	it('returns null when no user is authenticated', async () => {
		const { result } = renderHook(() => useUser());

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});

		expect(result.current).toBeNull();
	});

	it('returns user data when authenticated', async () => {
		const mockSession = {
			access_token: 'test-token',
			refresh_token: 'refresh-token',
			expires_in: 3600,
			token_type: 'bearer',
			user: {
				id: '123',
				email: 'test@example.com',
				app_metadata: {},
				user_metadata: { full_name: 'Test User', role: 'customer' },
				aud: 'authenticated',
				created_at: '2024-01-22T00:00:00.000Z',
				role: 'authenticated',
				updated_at: '2024-01-22T00:00:00.000Z',
			},
		};

		mockSupabase.auth.getSession.mockResolvedValueOnce({
			data: { session: mockSession },
			error: null,
		});

		const { result } = renderHook(() => useUser());

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});

		expect(result.current).toEqual(mockSession.user);
	});

	it('updates user data when auth state changes', async () => {
		const mockSession = {
			access_token: 'test-token',
			refresh_token: 'refresh-token',
			expires_in: 3600,
			token_type: 'bearer',
			user: {
				id: '123',
				email: 'test@example.com',
				app_metadata: {},
				user_metadata: { full_name: 'Test User', role: 'customer' },
				aud: 'authenticated',
				created_at: '2024-01-22T00:00:00.000Z',
				role: 'authenticated',
				updated_at: '2024-01-22T00:00:00.000Z',
			},
		};

		const { result } = renderHook(() => useUser());

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});

		expect(result.current).toBeNull();

		await act(async () => {
			authStateCallback('SIGNED_IN', mockSession);
			await new Promise((resolve) => setTimeout(resolve, 0));
		});

		expect(result.current).toEqual(mockSession.user);
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
