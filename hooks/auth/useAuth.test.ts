import { renderHook, act } from '@testing-library/react';
import { useAuth } from './useAuth';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => {
	const unsubscribe = jest.fn();
	const mockAuth = {
		getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
		onAuthStateChange: jest.fn((callback) => {
			callback('SIGNED_IN', { session: null });
			return { data: { subscription: { unsubscribe } } };
		}),
		signInWithPassword: jest.fn((credentials) => Promise.resolve({ data: null, error: null })),
		signUp: jest.fn((credentials) => Promise.resolve({ data: null, error: null })),
		signOut: jest.fn(() => Promise.resolve({ error: null })),
		resetPasswordForEmail: jest.fn((email, options) =>
			Promise.resolve({ data: null, error: null })
		),
	};

	return {
		createClient: jest.fn(() => ({
			auth: mockAuth,
		})),
	};
});

describe('useAuth', () => {
	let mockAuth: any;

	beforeEach(() => {
		// Reset all mocks
		jest.clearAllMocks();
		// @ts-expect-error: This is a mock
		mockAuth = (createClient() as any).auth;
	});

	it('initializes with loading state and no user', async () => {
		let result: any;
		await act(async () => {
			const hook = renderHook(() => useAuth());
			result = hook.result;
			await Promise.resolve(); // Wait for the next tick
		});

		expect(result.current.loading).toBe(false);
		expect(result.current.user).toBeNull();
	});

	it('handles successful sign in', async () => {
		const mockUser = {
			id: '123',
			email: 'test@example.com',
		};

		mockAuth.signInWithPassword.mockResolvedValueOnce({
			data: { user: mockUser, session: { user: mockUser } },
			error: null,
		});

		const { result } = renderHook(() => useAuth());

		await act(async () => {
			const response = await result.current.signIn({
				email: 'test@example.com',
				password: 'password123',
			});
			expect(response.error).toBeNull();
			expect(response.data.user).toEqual(mockUser);
		});

		expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
			email: 'test@example.com',
			password: 'password123',
		});
	});

	it('handles sign in error', async () => {
		const mockError = { message: 'Invalid credentials' } as any;
		mockAuth.signInWithPassword.mockResolvedValueOnce({
			data: { user: null, session: null },
			error: mockError,
		});

		const { result } = renderHook(() => useAuth());

		await act(async () => {
			const response = await result.current.signIn({
				email: 'test@example.com',
				password: 'wrongpassword',
			});
			expect(response.error).toBe(mockError);
		});
	});

	it('handles password reset request', async () => {
		mockAuth.resetPasswordForEmail.mockResolvedValueOnce({
			data: {},
			error: null,
		});

		const { result } = renderHook(() => useAuth());

		await act(async () => {
			const response = await result.current.resetPassword('test@example.com');
			expect(response.error).toBeNull();
		});

		expect(mockAuth.resetPasswordForEmail).toHaveBeenCalledWith('test@example.com', {
			redirectTo: expect.any(String),
		});
	});

	it('cleans up auth subscription on unmount', async () => {
		const unsubscribe = jest.fn();
		mockAuth.onAuthStateChange.mockImplementationOnce((callback) => {
			callback('SIGNED_IN', { session: null });
			return { data: { subscription: { unsubscribe } } };
		});

		const { unmount } = renderHook(() => useAuth());

		// Wait for initial setup
		await act(async () => {
			await Promise.resolve();
		});

		unmount();
		expect(unsubscribe).toHaveBeenCalled();
	});
});
