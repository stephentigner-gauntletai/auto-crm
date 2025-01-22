import React from 'react';
import { render } from '@testing-library/react';
import { screen, waitFor } from '@testing-library/dom/types';
import userEvent from '@testing-library/user-event';
import { SignInForm } from './SignInForm';
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

describe('SignInForm', () => {
	const mockSignIn = jest.fn();
	const mockToast = jest.fn();

	beforeEach(() => {
		(useAuth as jest.Mock).mockReturnValue({
			signIn: mockSignIn,
			loading: false,
		});
		(useToast as jest.Mock).mockReturnValue({
			toast: mockToast,
		});
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('renders the sign-in form', () => {
		render(<SignInForm />);

		expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
		expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
	});

	it('validates required fields', async () => {
		render(<SignInForm />);

		const submitButton = screen.getByRole('button', { name: /sign in/i });
		await userEvent.click(submitButton);

		expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
		expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
	});

	it('validates email format', async () => {
		render(<SignInForm />);

		const emailInput = screen.getByLabelText(/email/i);
		await userEvent.type(emailInput, 'invalid-email');

		const submitButton = screen.getByRole('button', { name: /sign in/i });
		await userEvent.click(submitButton);

		expect(await screen.findByText(/invalid email address/i)).toBeInTheDocument();
	});

	it('handles successful sign-in', async () => {
		mockSignIn.mockResolvedValueOnce({ error: null });

		render(<SignInForm />);

		const emailInput = screen.getByLabelText(/email/i);
		const passwordInput = screen.getByLabelText(/password/i);
		const submitButton = screen.getByRole('button', { name: /sign in/i });

		await userEvent.type(emailInput, 'test@example.com');
		await userEvent.type(passwordInput, 'password123');
		await userEvent.click(submitButton);

		await waitFor(() => {
			expect(mockSignIn).toHaveBeenCalledWith({
				email: 'test@example.com',
				password: 'password123',
			});
			expect(mockToast).toHaveBeenCalledWith({
				title: 'Success',
				description: 'You have been signed in successfully.',
			});
		});
	});

	it('handles sign-in error', async () => {
		const mockError = new Error('Invalid credentials');
		mockSignIn.mockResolvedValueOnce({ error: mockError });

		render(<SignInForm />);

		const emailInput = screen.getByLabelText(/email/i);
		const passwordInput = screen.getByLabelText(/password/i);
		const submitButton = screen.getByRole('button', { name: /sign in/i });

		await userEvent.type(emailInput, 'test@example.com');
		await userEvent.type(passwordInput, 'wrongpassword');
		await userEvent.click(submitButton);

		await waitFor(() => {
			expect(mockToast).toHaveBeenCalledWith({
				title: 'Error',
				description: 'Invalid credentials',
				variant: 'destructive',
			});
		});
	});

	it('disables submit button while loading', async () => {
		(useAuth as jest.Mock).mockReturnValue({
			signIn: mockSignIn,
			loading: true,
		});

		render(<SignInForm />);

		const submitButton = screen.getByRole('button', { name: /sign in/i });
		expect(submitButton).toBeDisabled();
	});

	it('shows loading state in button text', async () => {
		(useAuth as jest.Mock).mockReturnValue({
			signIn: mockSignIn,
			loading: true,
		});

		render(<SignInForm />);

		expect(screen.getByRole('button', { name: /signing in/i })).toBeInTheDocument();
	});
});
