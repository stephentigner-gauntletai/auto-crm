import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
	'image/jpeg',
	'image/png',
	'image/gif',
	'application/pdf',
	'text/plain',
	'application/msword',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

/**
 * @swagger
 * /api/tickets/{ticketId}/attachments:
 *   get:
 *     summary: Get attachments for a ticket
 *     parameters:
 *       - name: ticketId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of attachments for the ticket
 *   post:
 *     summary: Upload a file attachment
 *     parameters:
 *       - name: ticketId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: File uploaded successfully
 */

export async function GET(req: NextRequest, { params }: { params: { ticketId: string } }) {
	const supabase = createClient();

	try {
		const { data: attachments, error } = await supabase
			.from('attachments')
			.select(
				`
				id,
				file_name,
				file_size,
				content_type,
				created_at,
				user:user_id (
					id,
					full_name,
					avatar_url
				)
			`
			)
			.eq('ticket_id', params.ticketId)
			.order('created_at', { ascending: false });

		if (error) throw error;

		return NextResponse.json(attachments);
	} catch (error) {
		console.error('Error fetching attachments:', error);
		return NextResponse.json({ error: 'Failed to fetch attachments' }, { status: 500 });
	}
}

export async function POST(req: NextRequest, { params }: { params: { ticketId: string } }) {
	const supabase = createClient();

	try {
		// Get the current user
		const {
			data: { user },
			error: userError,
		} = await supabase.auth.getUser();
		if (userError) throw userError;
		if (!user) {
			return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
		}

		// Parse the multipart form data
		const formData = await req.formData();
		const file = formData.get('file') as File;

		// Validate file
		if (!file) {
			return NextResponse.json({ error: 'No file provided' }, { status: 400 });
		}

		if (file.size > MAX_FILE_SIZE) {
			return NextResponse.json({ error: 'File size exceeds limit (10MB)' }, { status: 400 });
		}

		if (!ALLOWED_FILE_TYPES.includes(file.type)) {
			return NextResponse.json({ error: 'File type not allowed' }, { status: 400 });
		}

		// Upload file to Supabase Storage
		const timestamp = new Date().getTime();
		const fileName = `${timestamp}-${file.name}`;
		const storagePath = `tickets/${params.ticketId}/${fileName}`;

		const { error: uploadError } = await supabase.storage
			.from('attachments')
			.upload(storagePath, file);

		if (uploadError) throw uploadError;

		// Create attachment record
		const { data: attachment, error: dbError } = await supabase
			.from('attachments')
			.insert({
				ticket_id: params.ticketId,
				user_id: user.id,
				file_name: file.name,
				file_size: file.size,
				content_type: file.type,
				storage_path: storagePath,
			})
			.select(
				`
				id,
				file_name,
				file_size,
				content_type,
				created_at,
				user:user_id (
					id,
					full_name,
					avatar_url
				)
			`
			)
			.single();

		if (dbError) throw dbError;

		// Add history entry
		await supabase.from('ticket_history').insert({
			ticket_id: params.ticketId,
			user_id: user.id,
			action: 'attachment_upload',
			details: {
				file_name: file.name,
				file_size: file.size,
			},
		});

		return NextResponse.json(attachment, { status: 201 });
	} catch (error) {
		console.error('Error uploading file:', error);
		return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
	}
}

export async function DELETE(req: NextRequest, { params }: { params: { ticketId: string } }) {
	const supabase = createClient();
	const searchParams = req.nextUrl.searchParams;
	const attachmentId = searchParams.get('id');

	if (!attachmentId) {
		return NextResponse.json({ error: 'Attachment ID is required' }, { status: 400 });
	}

	try {
		// Get the attachment details first
		const { data: attachment, error: fetchError } = await supabase
			.from('attachments')
			.select('storage_path, file_name')
			.eq('id', attachmentId)
			.single();

		if (fetchError) throw fetchError;
		if (!attachment) {
			return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
		}

		// Delete the file from storage
		const { error: storageError } = await supabase.storage
			.from('attachments')
			.remove([attachment.storage_path]);

		if (storageError) throw storageError;

		// Delete the attachment record
		const { error: dbError } = await supabase
			.from('attachments')
			.delete()
			.eq('id', attachmentId);

		if (dbError) throw dbError;

		// Add history entry
		await supabase.from('ticket_history').insert({
			ticket_id: params.ticketId,
			action: 'attachment_delete',
			details: {
				file_name: attachment.file_name,
			},
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Error deleting attachment:', error);
		return NextResponse.json({ error: 'Failed to delete attachment' }, { status: 500 });
	}
}
