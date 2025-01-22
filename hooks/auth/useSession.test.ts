import { renderHook, act } from '@testing-library/react';
import { useSession } from './useSession';
import { createClient, AuthChangeEvent, Session } from '@supabase/supabase-js';

jest.mock('@supabase/supabase-js');

type AuthStateCallback = (event: AuthChangeEvent, session: Session | null) => void;

describe('useSession', () => {
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

	it('initializes with loading state and no session', async () => {
		const { result } = renderHook(() => useSession());

		expect(result.current.loading).toBe(true);
		expect(result.current.session).toBeNull();
		expect(result.current.error).toBeNull();

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});

		expect(result.current.loading).toBe(false);
	});

	it('returns session data when available', async () => {
		const mockSession = {
			access_token: 'test-token',
			refresh_token: 'refresh-token',
			expires_in: 3600,
			token_type: 'bearer',
			user: {
				id: '123',
				email: 'test@example.com',
				app_metadata: {},
				user_metadata: {},
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

		const { result } = renderHook(() => useSession());

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});

		expect(result.current.loading).toBe(false);
		expect(result.current.session).toEqual(mockSession);
		expect(result.current.error).toBeNull();
	});

	it('handles session error', async () => {
		const mockError = { message: 'Failed to get session' };
		mockSupabase.auth.getSession.mockResolvedValueOnce({
			data: { session: null },
			error: mockError,
		});

		const { result } = renderHook(() => useSession());

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});

		expect(result.current.loading).toBe(false);
		expect(result.current.session).toBeNull();
		expect(result.current.error).toEqual(mockError);
	});

	it('updates session on auth state change', async () => {
		const mockSession = {
			access_token: 'test-token',
			refresh_token: 'refresh-token',
			expires_in: 3600,
			token_type: 'bearer',
			user: {
				id: '123',
				email: 'test@example.com',
				app_metadata: {},
				user_metadata: {},
				aud: 'authenticated',
				created_at: '2024-01-22T00:00:00.000Z',
				role: 'authenticated',
				updated_at: '2024-01-22T00:00:00.000Z',
			},
		};

		const { result } = renderHook(() => useSession());

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});

		await act(async () => {
			authStateCallback('SIGNED_IN', mockSession);
			await new Promise((resolve) => setTimeout(resolve, 0));
		});

		expect(result.current.loading).toBe(false);
		expect(result.current.session).toEqual(mockSession);
		expect(result.current.error).toBeNull();
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
