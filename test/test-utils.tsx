import React from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock Supabase client for testing
export const mockSupabaseClient = {
	auth: {
		signInWithPassword: jest.fn(),
		signUp: jest.fn(),
		signOut: jest.fn(),
		resetPasswordForEmail: jest.fn(),
	},
	from: jest.fn(() => ({
		select: jest.fn().mockReturnThis(),
		insert: jest.fn().mockReturnThis(),
		update: jest.fn().mockReturnThis(),
		delete: jest.fn().mockReturnThis(),
		eq: jest.fn().mockReturnThis(),
	})),
};

// Mock useRouter
export const mockRouter = {
	push: jest.fn(),
	replace: jest.fn(),
	refresh: jest.fn(),
	back: jest.fn(),
	prefetch: jest.fn(),
};

// Custom render function with user event setup
function customRender(ui: React.ReactElement, options = {}) {
	return {
		...render(ui, options),
		user: userEvent.setup(),
	};
}

// Re-export everything
export * from '@testing-library/react';
export { customRender as render, userEvent };

// Helper to setup mocks
export function setupMocks() {
	// Reset all mocks before each test
	jest.clearAllMocks();

	// Setup Supabase mock
	jest.mock('@supabase/supabase-js', () => ({
		createClient: jest.fn(() => mockSupabaseClient),
	}));

	// Setup router mock
	jest.mock('next/navigation', () => ({
		useRouter: () => mockRouter,
		useSearchParams: () => new URLSearchParams(),
	}));
}

// Helper to create a mock response
export function createMockResponse<T>(data: T) {
	return { data, error: null };
}

// Helper to create a mock error response
export function createMockError(message: string, code = 'ERROR') {
	return {
		data: null,
		error: { message, code },
	};
}

// Helper to wait for promises to resolve
export async function waitForPromises() {
	await new Promise((resolve) => setTimeout(resolve, 0));
}
