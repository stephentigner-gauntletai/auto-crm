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

const signInSchema = z.object({
	email: z.string().email('Invalid email address'),
	password: z.string().min(6, 'Password must be at least 6 characters'),
});

type SignInFormData = z.infer<typeof signInSchema>;

export function SignInForm() {
	const { signIn } = useAuth();
	const { toast } = useToast();
	const [loading, setLoading] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<SignInFormData>({
		resolver: zodResolver(signInSchema),
	});

	const onSubmit = async (data: SignInFormData) => {
		try {
			setLoading(true);
			const { error } = await signIn(data);
			if (error) throw error;

			toast({
				title: 'Success',
				description: 'You have been signed in successfully.',
			});
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to sign in';
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
				<CardTitle>Sign In</CardTitle>
				<CardDescription>
					Enter your email and password to access your account
				</CardDescription>
			</CardHeader>
			<form onSubmit={handleSubmit(onSubmit)}>
				<CardContent className="space-y-4">
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
				</CardContent>
				<CardFooter className="flex justify-between">
					<Button
						type="button"
						variant="ghost"
						onClick={() => (window.location.href = '/auth/reset-password')}
					>
						Forgot Password?
					</Button>
					<Button type="submit" disabled={loading}>
						{loading ? 'Signing in...' : 'Sign In'}
					</Button>
				</CardFooter>
			</form>
		</Card>
	);
}
