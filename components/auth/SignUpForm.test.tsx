import React from 'react';
import { render } from '@testing-library/react';
// @ts-expect-error: The functions are there and should have types but it's not working
import { screen, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { SignUpForm } from './SignUpForm';
import { useAuth } from '../../hooks/auth/useAuth';
import { useToast } from '../../components/ui/use-toast';
import '@testing-library/jest-dom';

// Mock the auth hook
jest.mock('../../hooks/auth/useAuth', () => ({
	useAuth: jest.fn(),
}));

// Mock the toast hook
jest.mock('../../components/ui/use-toast', () => ({
	useToast: jest.fn(() => ({
		toast: jest.fn(),
	})),
}));

describe('SignUpForm', () => {
	const mockSignUp = jest.fn();
	const mockToast = jest.fn();
	const originalLocation = window.location;

	beforeEach(() => {
		(useAuth as jest.Mock).mockReturnValue({
			signUp: mockSignUp,
		});
		(useToast as jest.Mock).mockReturnValue({
			toast: mockToast,
		});
		// Mock window.location
		delete (window as any).location;
		window.location = { ...originalLocation, href: '' };
	});

	afterEach(() => {
		jest.clearAllMocks();
		window.location = originalLocation;
	});

	it('renders the sign up form', () => {
		render(<SignUpForm />);

		expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
		expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
	});

	it('handles successful sign up', async () => {
		mockSignUp.mockResolvedValueOnce({ error: null });
		const user = userEvent.setup();

		render(<SignUpForm />);

		await user.type(screen.getByLabelText(/full name/i), 'Test User');
		await user.type(screen.getByLabelText(/email/i), 'test@example.com');
		await user.type(screen.getByLabelText(/^password$/i), 'Password123!');
		await user.type(screen.getByLabelText(/confirm password/i), 'Password123!');
		await user.click(screen.getByRole('button', { name: /sign up/i }));

		await waitFor(() => {
			expect(mockSignUp).toHaveBeenCalledWith({
				email: 'test@example.com',
				password: 'Password123!',
				full_name: 'Test User',
			});
			expect(mockToast).toHaveBeenCalledWith({
				title: 'Success',
				description:
					'Your account has been created. Please check your email for verification.',
			});
		});
	});

	it('handles sign up error', async () => {
		const error = new Error('Email already registered');
		mockSignUp.mockResolvedValueOnce({ error });
		const user = userEvent.setup();

		render(<SignUpForm />);

		await user.type(screen.getByLabelText(/full name/i), 'Test User');
		await user.type(screen.getByLabelText(/email/i), 'test@example.com');
		await user.type(screen.getByLabelText(/^password$/i), 'Password123!');
		await user.type(screen.getByLabelText(/confirm password/i), 'Password123!');
		await user.click(screen.getByRole('button', { name: /sign up/i }));

		await waitFor(() => {
			expect(mockToast).toHaveBeenCalledWith({
				title: 'Error',
				description: expect.any(Object),
			});
		});
	});

	it('validates form fields', async () => {
		const user = userEvent.setup();
		render(<SignUpForm />);

		await user.click(screen.getByRole('button', { name: /sign up/i }));

		await waitFor(() => {
			expect(
				screen.getByText(/full name must be at least 2 characters/i)
			).toBeInTheDocument();
			expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
			expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
		});
	});

	it('validates password requirements', async () => {
		const user = userEvent.setup();
		render(<SignUpForm />);

		// First test: too short password
		await user.type(screen.getByLabelText(/^password$/i), 'weak');
		await user.type(screen.getByLabelText(/confirm password/i), 'different');
		await user.click(screen.getByRole('button', { name: /sign up/i }));

		await waitFor(() => {
			expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
		});

		// Second test: missing uppercase, number, and passwords don't match
		await user.clear(screen.getByLabelText(/^password$/i));
		await user.type(screen.getByLabelText(/^password$/i), 'weakpassword');
		await user.click(screen.getByRole('button', { name: /sign up/i }));

		await waitFor(() => {
			expect(
				screen.getByText(/password must contain at least one uppercase letter/i)
			).toBeInTheDocument();
		});

		// Third test: missing number and passwords don't match
		await user.clear(screen.getByLabelText(/^password$/i));
		await user.type(screen.getByLabelText(/^password$/i), 'Weakpassword');
		await user.click(screen.getByRole('button', { name: /sign up/i }));

		await waitFor(() => {
			expect(
				screen.getByText(/password must contain at least one number/i)
			).toBeInTheDocument();
			expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
		});
	});

	it('navigates to sign in page', async () => {
		const user = userEvent.setup();
		render(<SignUpForm />);

		await user.click(screen.getByRole('button', { name: /already have an account/i }));

		expect(window.location.href).toBe('/auth/sign-in');
	});
});
