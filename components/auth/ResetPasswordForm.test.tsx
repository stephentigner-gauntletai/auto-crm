import React from 'react';
import { render } from '@testing-library/react';
// @ts-expect-error: The functions are there and should have types but it's not working
import { screen, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { ResetPasswordForm } from './ResetPasswordForm';
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

describe('ResetPasswordForm', () => {
	const mockResetPassword = jest.fn();
	const mockToast = jest.fn();
	const originalLocation = window.location;

	beforeEach(() => {
		(useAuth as jest.Mock).mockReturnValue({
			resetPassword: mockResetPassword,
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

	it('renders the reset password form', () => {
		render(<ResetPasswordForm />);

		expect(screen.getByRole('heading', { name: /reset password/i })).toBeInTheDocument();
		expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /send instructions/i })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /back to sign in/i })).toBeInTheDocument();
	});

	it('handles successful password reset request', async () => {
		mockResetPassword.mockResolvedValueOnce({ error: null });

		render(<ResetPasswordForm />);

		const emailInput = screen.getByLabelText(/email/i);
		const submitButton = screen.getByRole('button', { name: /send instructions/i });

		await userEvent.type(emailInput, 'test@example.com');
		await userEvent.click(submitButton);

		await waitFor(() => {
			expect(mockResetPassword).toHaveBeenCalledWith('test@example.com');
			expect(mockToast).toHaveBeenCalledWith({
				title: 'Success',
				description: 'Check your email for password reset instructions.',
			});
		});
	});

	it('handles reset password error', async () => {
		const mockError = new Error('Email not found');
		mockResetPassword.mockResolvedValueOnce({ error: mockError });

		render(<ResetPasswordForm />);

		const emailInput = screen.getByLabelText(/email/i);
		const submitButton = screen.getByRole('button', { name: /send instructions/i });

		await userEvent.type(emailInput, 'nonexistent@example.com');
		await userEvent.click(submitButton);

		await waitFor(() => {
			expect(mockToast).toHaveBeenCalledWith({
				title: 'Error',
				description: expect.any(Object),
			});
		});
	});

	it('validates email field', async () => {
		render(<ResetPasswordForm />);

		const submitButton = screen.getByRole('button', { name: /send instructions/i });
		await userEvent.click(submitButton);

		await waitFor(() => {
			const emailError = screen.getByText('Invalid email address', {
				selector: 'p.text-sm.text-destructive',
			});
			expect(emailError).toBeInTheDocument();
		});
	});

	it('navigates back to sign in page', async () => {
		render(<ResetPasswordForm />);

		const backButton = screen.getByRole('button', { name: /back to sign in/i });
		await userEvent.click(backButton);

		expect(window.location.href).toBe('/auth/sign-in');
	});
});
