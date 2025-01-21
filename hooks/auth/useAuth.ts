import { createClient } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';
import type { User, AuthError } from '@supabase/supabase-js';
import type { Database } from '../../src/types/supabase';

interface AuthState {
	user: User | null;
	loading: boolean;
	error: AuthError | null;
}

interface SignInData {
	email: string;
	password: string;
}

interface SignUpData extends SignInData {
	full_name: string;
}

const supabase = createClient<Database>(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function useAuth() {
	const [state, setState] = useState<AuthState>({
		user: null,
		loading: true,
		error: null,
	});

	useEffect(() => {
		// Get initial session
		supabase.auth.getSession().then(({ data: { session }, error }) => {
			setState((prev) => ({
				...prev,
				user: session?.user ?? null,
				loading: false,
				error: error ?? null,
			}));
		});

		// Listen for auth changes
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setState((prev) => ({
				...prev,
				user: session?.user ?? null,
				loading: false,
				error: null,
			}));
		});

		return () => {
			subscription.unsubscribe();
		};
	}, []);

	const signIn = useCallback(async ({ email, password }: SignInData) => {
		setState((prev) => ({ ...prev, loading: true, error: null }));
		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});
		setState((prev) => ({
			...prev,
			user: data?.user ?? null,
			loading: false,
			error: error ?? null,
		}));
		return { data, error };
	}, []);

	const signUp = useCallback(async ({ email, password, full_name }: SignUpData) => {
		setState((prev) => ({ ...prev, loading: true, error: null }));
		const { data, error } = await supabase.auth.signUp({
			email,
			password,
			options: {
				data: {
					full_name,
					role: 'customer', // Default role for new users
				},
			},
		});
		setState((prev) => ({
			...prev,
			user: data?.user ?? null,
			loading: false,
			error: error ?? null,
		}));
		return { data, error };
	}, []);

	const signOut = useCallback(async () => {
		setState((prev) => ({ ...prev, loading: true, error: null }));
		const { error } = await supabase.auth.signOut();
		setState((prev) => ({
			...prev,
			user: null,
			loading: false,
			error: error ?? null,
		}));
		return { error };
	}, []);

	const resetPassword = useCallback(async (email: string) => {
		setState((prev) => ({ ...prev, loading: true, error: null }));
		const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
			redirectTo: `${window.location.origin}/auth/reset-password`,
		});
		setState((prev) => ({
			...prev,
			loading: false,
			error: error ?? null,
		}));
		return { data, error };
	}, []);

	return {
		user: state.user,
		loading: state.loading,
		error: state.error,
		signIn,
		signUp,
		signOut,
		resetPassword,
	};
}
