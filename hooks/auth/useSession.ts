import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';

interface SessionState {
	session: Session | null;
	loading: boolean;
	error: Error | null;
}

export function useSession() {
	const [state, setState] = useState<SessionState>({
		session: null,
		loading: true,
		error: null,
	});

	const supabase = createClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
	);

	useEffect(() => {
		// Check current session
		supabase.auth.getSession().then(({ data: { session } }) => {
			setState((current) => ({
				...current,
				session,
				loading: false,
			}));
		});

		// Listen for auth changes
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setState((current) => ({
				...current,
				session,
				loading: false,
			}));
		});

		return () => {
			subscription.unsubscribe();
		};
	}, [supabase.auth]);

	return state;
}
