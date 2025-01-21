import * as React from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../../hooks/auth/useAuth';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { useToast } from '../ui/use-toast';

const signUpSchema = z
	.object({
		email: z.string().email('Invalid email address'),
		password: z
			.string()
			.min(8, 'Password must be at least 8 characters')
			.regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
			.regex(/[a-z]/, 'Password must contain at least one lowercase letter')
			.regex(/[0-9]/, 'Password must contain at least one number'),
		confirmPassword: z.string(),
		full_name: z.string().min(2, 'Full name must be at least 2 characters'),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match",
		path: ['confirmPassword'],
	});

type SignUpFormData = z.infer<typeof signUpSchema>;

export function SignUpForm() {
	const { signUp } = useAuth();
	const { toast } = useToast();
	const [loading, setLoading] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<SignUpFormData>({
		resolver: zodResolver(signUpSchema),
	});

	const onSubmit = async (data: SignUpFormData) => {
		try {
			setLoading(true);
			const { error } = await signUp({
				email: data.email,
				password: data.password,
				full_name: data.full_name,
			});

			if (error) throw error;

			toast({
				title: 'Success',
				description:
					'Your account has been created. Please check your email for verification.',
			});
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to create account';
			toast({
				title: 'Error',
				description: <div className="text-destructive">{message}</div>,
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<Card className="w-[400px]">
			<CardHeader>
				<CardTitle>Create Account</CardTitle>
				<CardDescription>Sign up for a new account to get started</CardDescription>
			</CardHeader>
			<form onSubmit={handleSubmit(onSubmit)}>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="full_name">Full Name</Label>
						<Input id="full_name" placeholder="John Doe" {...register('full_name')} />
						{errors.full_name && (
							<p className="text-sm text-destructive">{errors.full_name.message}</p>
						)}
					</div>
					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							type="email"
							placeholder="you@example.com"
							{...register('email')}
						/>
						{errors.email && (
							<p className="text-sm text-destructive">{errors.email.message}</p>
						)}
					</div>
					<div className="space-y-2">
						<Label htmlFor="password">Password</Label>
						<Input id="password" type="password" {...register('password')} />
						{errors.password && (
							<p className="text-sm text-destructive">{errors.password.message}</p>
						)}
					</div>
					<div className="space-y-2">
						<Label htmlFor="confirmPassword">Confirm Password</Label>
						<Input
							id="confirmPassword"
							type="password"
							{...register('confirmPassword')}
						/>
						{errors.confirmPassword && (
							<p className="text-sm text-destructive">
								{errors.confirmPassword.message}
							</p>
						)}
					</div>
				</CardContent>
				<CardFooter className="flex justify-between">
					<Button
						type="button"
						variant="ghost"
						onClick={() => (window.location.href = '/auth/sign-in')}
					>
						Already have an account?
					</Button>
					<Button type="submit" disabled={loading}>
						{loading ? 'Creating account...' : 'Sign Up'}
					</Button>
				</CardFooter>
			</form>
		</Card>
	);
}
