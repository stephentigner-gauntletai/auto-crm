import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Message {
	id: string;
	content: string;
	created_at: string;
	user: {
		id: string;
		full_name: string;
		avatar_url?: string;
	};
}

export function useMessages(ticketId: string) {
	const [messages, setMessages] = useState<Message[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const supabase = useMemo(() => createClient(), []);

	const fetchMessages = useCallback(async () => {
		try {
			setIsLoading(true);
			const response = await fetch(`/api/tickets/${ticketId}/messages`);
			if (!response.ok) {
				throw new Error('Failed to fetch messages');
			}
			const data = await response.json();
			setMessages(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred');
		} finally {
			setIsLoading(false);
		}
	}, [ticketId]);

	useEffect(() => {
		fetchMessages();
		// Subscribe to new messages
		const channel = supabase
			.channel(`conversations:${ticketId}`)
			.on(
				'postgres_changes',
				{
					event: 'INSERT',
					schema: 'public',
					table: 'conversations',
					filter: `ticket_id=eq.${ticketId}`,
				},
				(payload) => {
					const newMessage = {
						...payload.new,
						content: payload.new.message,
					} as Message;
					setMessages((prev) => [...prev, newMessage]);
				}
			)
			.subscribe();

		return () => {
			channel.unsubscribe();
		};
	}, [ticketId, fetchMessages, supabase]);

	const sendMessage = async (content: string) => {
		try {
			const response = await fetch(`/api/tickets/${ticketId}/messages`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ content }),
			});

			if (!response.ok) {
				throw new Error('Failed to send message');
			}

			const data = await response.json();
			return data;
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred');
			throw err;
		}
	};

	return {
		messages,
		isLoading,
		error,
		sendMessage,
		refreshMessages: fetchMessages,
	};
}
