import React from 'react';
import { render } from '../../test/test-utils';
import { SignInForm } from './SignInForm';
import {
	mockSupabaseClient,
	createMockResponse,
	createMockError,
	setupMocks,
} from '../../test/test-utils';

describe('SignInForm', () => {
	beforeEach(() => {
		setupMocks();
	});

	it('renders the sign in form', () => {
		const { getByRole, getByLabelText } = render(<SignInForm />);

		expect(getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
		expect(getByLabelText(/email/i)).toBeInTheDocument();
		expect(getByLabelText(/password/i)).toBeInTheDocument();
		expect(getByRole('button', { name: /sign in/i })).toBeInTheDocument();
	});

	it('handles successful sign in', async () => {
		mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce(
			createMockResponse({ user: { id: '123', email: 'test@example.com' } })
		);

		const { getByRole, getByLabelText, getByText, user } = render(<SignInForm />);

		await user.type(getByLabelText(/email/i), 'test@example.com');
		await user.type(getByLabelText(/password/i), 'password123');
		await user.click(getByRole('button', { name: /sign in/i }));

		// Wait for the API call
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
			email: 'test@example.com',
			password: 'password123',
		});

		expect(getByText(/you have been signed in successfully/i)).toBeInTheDocument();
	});

	it('handles sign in error', async () => {
		mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce(
			createMockError('Invalid email or password')
		);

		const { getByRole, getByLabelText, getByText, user } = render(<SignInForm />);

		await user.type(getByLabelText(/email/i), 'test@example.com');
		await user.type(getByLabelText(/password/i), 'wrongpassword');
		await user.click(getByRole('button', { name: /sign in/i }));

		// Wait for the API call
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(getByText(/invalid email or password/i)).toBeInTheDocument();
	});

	it('validates form fields', async () => {
		const { getByRole, findByText, user } = render(<SignInForm />);

		await user.click(getByRole('button', { name: /sign in/i }));

		expect(await findByText(/invalid email address/i)).toBeInTheDocument();
		expect(await findByText(/password must be at least 6 characters/i)).toBeInTheDocument();
	});
});
