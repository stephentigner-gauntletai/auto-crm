import React from 'react';
import { render } from '../../test/test-utils';
import { ResetPasswordForm } from './ResetPasswordForm';
import {
	mockSupabaseClient,
	createMockResponse,
	createMockError,
	setupMocks,
	mockRouter,
} from '../../test/test-utils';

describe('ResetPasswordForm', () => {
	beforeEach(() => {
		setupMocks();
	});

	it('renders the reset password form', () => {
		const { getByRole, getByLabelText } = render(<ResetPasswordForm />);

		expect(getByRole('heading', { name: /reset password/i })).toBeInTheDocument();
		expect(getByLabelText(/email/i)).toBeInTheDocument();
		expect(getByRole('button', { name: /send instructions/i })).toBeInTheDocument();
		expect(getByRole('button', { name: /back to sign in/i })).toBeInTheDocument();
	});

	it('handles successful password reset request', async () => {
		mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValueOnce(
			createMockResponse({ data: true })
		);

		const { getByRole, getByLabelText, getByText, user } = render(<ResetPasswordForm />);

		await user.type(getByLabelText(/email/i), 'test@example.com');
		await user.click(getByRole('button', { name: /send instructions/i }));

		// Wait for the API call
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(mockSupabaseClient.auth.resetPasswordForEmail).toHaveBeenCalledWith(
			'test@example.com'
		);

		expect(getByText(/check your email for password reset instructions/i)).toBeInTheDocument();
	});

	it('handles reset password error', async () => {
		mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValueOnce(
			createMockError('Email not found')
		);

		const { getByRole, getByLabelText, getByText, user } = render(<ResetPasswordForm />);

		await user.type(getByLabelText(/email/i), 'nonexistent@example.com');
		await user.click(getByRole('button', { name: /send instructions/i }));

		// Wait for the API call
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(getByText(/email not found/i)).toBeInTheDocument();
	});

	it('validates email field', async () => {
		const { getByRole, findByText, user } = render(<ResetPasswordForm />);

		await user.click(getByRole('button', { name: /send instructions/i }));

		expect(await findByText(/invalid email address/i)).toBeInTheDocument();
	});

	it('navigates back to sign in page', async () => {
		const { getByRole, user } = render(<ResetPasswordForm />);

		await user.click(getByRole('button', { name: /back to sign in/i }));

		expect(mockRouter.push).toHaveBeenCalledWith('/auth/sign-in');
	});
});
