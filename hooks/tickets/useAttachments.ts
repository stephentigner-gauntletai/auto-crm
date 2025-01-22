import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/supabase';

type Attachment = Database['public']['Tables']['attachments']['Row'] & {
	user: {
		id: string;
		full_name: string;
		avatar_url?: string;
	};
};

export function useAttachments(ticketId: string) {
	const [attachments, setAttachments] = useState<Attachment[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const supabase = createClient();

	const fetchAttachments = useCallback(async () => {
		try {
			setIsLoading(true);
			const response = await fetch(`/api/tickets/${ticketId}/attachments`);
			if (!response.ok) {
				throw new Error('Failed to fetch attachments');
			}
			const data = await response.json();
			setAttachments(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred');
		} finally {
			setIsLoading(false);
		}
	}, [ticketId]);

	useEffect(() => {
		fetchAttachments();
		// Subscribe to new attachments
		const channel = supabase
			.channel(`attachments:${ticketId}`)
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'attachments',
					filter: `ticket_id=eq.${ticketId}`,
				},
				() => {
					// Refetch to get the complete data with user information
					fetchAttachments();
				}
			)
			.subscribe();

		return () => {
			channel.unsubscribe();
		};
	}, [ticketId, fetchAttachments, supabase]);

	const uploadFile = async (file: File) => {
		try {
			const formData = new FormData();
			formData.append('file', file);

			const response = await fetch(`/api/tickets/${ticketId}/attachments`, {
				method: 'POST',
				body: formData,
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to upload file');
			}

			const data = await response.json();
			return data;
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred');
			throw err;
		}
	};

	const deleteFile = async (attachmentId: string) => {
		try {
			const response = await fetch(
				`/api/tickets/${ticketId}/attachments?id=${attachmentId}`,
				{
					method: 'DELETE',
				}
			);

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to delete file');
			}

			return true;
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred');
			throw err;
		}
	};

	const getDownloadUrl = async (storagePath: string) => {
		try {
			const { data, error } = await supabase.storage
				.from('attachments')
				.createSignedUrl(storagePath, 60); // URL valid for 60 seconds

			if (error) throw error;
			return data.signedUrl;
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred');
			throw err;
		}
	};

	return {
		attachments,
		isLoading,
		error,
		uploadFile,
		deleteFile,
		getDownloadUrl,
		refreshAttachments: fetchAttachments,
	};
}
