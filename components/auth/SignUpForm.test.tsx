import React from 'react';
import { render } from '../../test/test-utils';
import { SignUpForm } from './SignUpForm';
import {
	mockSupabaseClient,
	createMockResponse,
	createMockError,
	setupMocks,
} from '../../test/test-utils';

describe('SignUpForm', () => {
	beforeEach(() => {
		setupMocks();
	});

	it('renders the sign up form', () => {
		const { getByRole, getByLabelText } = render(<SignUpForm />);

		expect(getByRole('heading', { name: /create account/i })).toBeInTheDocument();
		expect(getByLabelText(/full name/i)).toBeInTheDocument();
		expect(getByLabelText(/email/i)).toBeInTheDocument();
		expect(getByLabelText(/^password$/i)).toBeInTheDocument();
		expect(getByLabelText(/confirm password/i)).toBeInTheDocument();
		expect(getByRole('button', { name: /sign up/i })).toBeInTheDocument();
	});

	it('handles successful sign up', async () => {
		mockSupabaseClient.auth.signUp.mockResolvedValueOnce(
			createMockResponse({
				user: { id: '123', email: 'test@example.com' },
				session: null,
			})
		);

		const { getByRole, getByLabelText, getByText, user } = render(<SignUpForm />);

		await user.type(getByLabelText(/full name/i), 'Test User');
		await user.type(getByLabelText(/email/i), 'test@example.com');
		await user.type(getByLabelText(/^password$/i), 'Password123!');
		await user.type(getByLabelText(/confirm password/i), 'Password123!');
		await user.click(getByRole('button', { name: /sign up/i }));

		// Wait for the API call
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
			email: 'test@example.com',
			password: 'Password123!',
			options: {
				data: {
					full_name: 'Test User',
				},
			},
		});

		expect(getByText(/check your email for verification/i)).toBeInTheDocument();
	});

	it('handles sign up error', async () => {
		mockSupabaseClient.auth.signUp.mockResolvedValueOnce(
			createMockError('Email already registered')
		);

		const { getByRole, getByLabelText, getByText, user } = render(<SignUpForm />);

		await user.type(getByLabelText(/full name/i), 'Test User');
		await user.type(getByLabelText(/email/i), 'test@example.com');
		await user.type(getByLabelText(/^password$/i), 'Password123!');
		await user.type(getByLabelText(/confirm password/i), 'Password123!');
		await user.click(getByRole('button', { name: /sign up/i }));

		// Wait for the API call
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(getByText(/email already registered/i)).toBeInTheDocument();
	});

	it('validates form fields', async () => {
		const { getByRole, findByText, user } = render(<SignUpForm />);

		await user.click(getByRole('button', { name: /sign up/i }));

		expect(await findByText(/full name must be at least 2 characters/i)).toBeInTheDocument();
		expect(await findByText(/invalid email address/i)).toBeInTheDocument();
		expect(await findByText(/password must be at least 8 characters/i)).toBeInTheDocument();
	});

	it('validates password requirements', async () => {
		const { getByRole, getByLabelText, findByText, user } = render(<SignUpForm />);

		await user.type(getByLabelText(/^password$/i), 'weak');
		await user.type(getByLabelText(/confirm password/i), 'different');
		await user.click(getByRole('button', { name: /sign up/i }));

		expect(
			await findByText(/password must contain at least one uppercase letter/i)
		).toBeInTheDocument();
		expect(await findByText(/password must contain at least one number/i)).toBeInTheDocument();
		expect(await findByText(/passwords don't match/i)).toBeInTheDocument();
	});
});
