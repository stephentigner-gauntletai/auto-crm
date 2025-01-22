import { renderHook, act } from '@testing-library/react';
import { useAuth } from './useAuth';
import { createClient } from '@supabase/supabase-js';

jest.mock('@supabase/supabase-js');

describe('useAuth', () => {
	const mockSupabase = {
		auth: {
			getSession: jest.fn(),
			onAuthStateChange: jest.fn(() => ({
				data: { subscription: { unsubscribe: jest.fn() } },
			})),
			signInWithPassword: jest.fn(),
			signUp: jest.fn(),
			signOut: jest.fn(),
			resetPasswordForEmail: jest.fn(),
		},
	};

	beforeEach(() => {
		(createClient as jest.Mock).mockReturnValue(mockSupabase);
		mockSupabase.auth.getSession.mockResolvedValue({
			data: { session: null },
			error: null,
		});
	});

	it('initializes with loading state and no user', () => {
		const { result } = renderHook(() => useAuth());
		expect(result.current.loading).toBe(true);
		expect(result.current.user).toBeNull();
		expect(result.current.error).toBeNull();
	});

	it('updates state when session is loaded', async () => {
		const mockUser = { id: '123', email: 'test@example.com' };
		mockSupabase.auth.getSession.mockResolvedValueOnce({
			data: { session: { user: mockUser } },
			error: null,
		});

		const { result } = renderHook(() => useAuth());

		// Wait for the initial session check
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});

		expect(result.current.loading).toBe(false);
		expect(result.current.user).toEqual(mockUser);
		expect(result.current.error).toBeNull();
	});

	it('handles sign in successfully', async () => {
		const mockUser = { id: '123', email: 'test@example.com' };
		mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
			data: { user: mockUser },
			error: null,
		});

		const { result } = renderHook(() => useAuth());

		await act(async () => {
			await result.current.signIn({
				email: 'test@example.com',
				password: 'password123',
			});
		});

		expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
			email: 'test@example.com',
			password: 'password123',
		});
		expect(result.current.loading).toBe(false);
		expect(result.current.error).toBeNull();
	});

	it('handles sign in error', async () => {
		const mockError = { message: 'Invalid credentials' };
		mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
			data: { user: null },
			error: mockError,
		});

		const { result } = renderHook(() => useAuth());

		await act(async () => {
			await result.current.signIn({
				email: 'test@example.com',
				password: 'wrongpassword',
			});
		});

		expect(result.current.loading).toBe(false);
		expect(result.current.error).toEqual(mockError);
		expect(result.current.user).toBeNull();
	});

	it('handles sign up successfully', async () => {
		const mockUser = { id: '123', email: 'test@example.com' };
		mockSupabase.auth.signUp.mockResolvedValueOnce({
			data: { user: mockUser },
			error: null,
		});

		const { result } = renderHook(() => useAuth());

		await act(async () => {
			await result.current.signUp({
				email: 'test@example.com',
				password: 'Password123',
				full_name: 'Test User',
			});
		});

		expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
			email: 'test@example.com',
			password: 'Password123',
			options: {
				data: {
					full_name: 'Test User',
				},
			},
		});
		expect(result.current.loading).toBe(false);
		expect(result.current.error).toBeNull();
	});

	it('handles sign out successfully', async () => {
		mockSupabase.auth.signOut.mockResolvedValueOnce({
			error: null,
		});

		const { result } = renderHook(() => useAuth());

		await act(async () => {
			await result.current.signOut();
		});

		expect(mockSupabase.auth.signOut).toHaveBeenCalled();
		expect(result.current.loading).toBe(false);
		expect(result.current.user).toBeNull();
		expect(result.current.error).toBeNull();
	});

	it('handles password reset request', async () => {
		mockSupabase.auth.resetPasswordForEmail.mockResolvedValueOnce({
			data: {},
			error: null,
		});

		const { result } = renderHook(() => useAuth());

		await act(async () => {
			await result.current.resetPassword('test@example.com');
		});

		expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('test@example.com', {
			redirectTo: expect.stringContaining('/auth/reset-password'),
		});
		expect(result.current.loading).toBe(false);
		expect(result.current.error).toBeNull();
	});

	it('cleans up auth subscription on unmount', () => {
		const unsubscribe = jest.fn();
		mockSupabase.auth.onAuthStateChange.mockReturnValueOnce({
			data: { subscription: { unsubscribe } },
		});

		const { unmount } = renderHook(() => useAuth());
		unmount();

		expect(unsubscribe).toHaveBeenCalled();
	});
});
