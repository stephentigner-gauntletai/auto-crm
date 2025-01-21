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

const resetPasswordSchema = z.object({
	email: z.string().email('Invalid email address'),
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm() {
	const { resetPassword } = useAuth();
	const { toast } = useToast();
	const [loading, setLoading] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<ResetPasswordFormData>({
		resolver: zodResolver(resetPasswordSchema),
	});

	const onSubmit = async (data: ResetPasswordFormData) => {
		try {
			setLoading(true);
			const { error } = await resetPassword(data.email);

			if (error) throw error;

			toast({
				title: 'Success',
				description: 'Check your email for password reset instructions.',
			});
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to send reset email';
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
				<CardTitle>Reset Password</CardTitle>
				<CardDescription>
					Enter your email address and we&apos;ll send you instructions to reset your
					password
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
				</CardContent>
				<CardFooter className="flex justify-between">
					<Button
						type="button"
						variant="ghost"
						onClick={() => (window.location.href = '/auth/sign-in')}
					>
						Back to Sign In
					</Button>
					<Button type="submit" disabled={loading}>
						{loading ? 'Sending...' : 'Send Instructions'}
					</Button>
				</CardFooter>
			</form>
		</Card>
	);
}
