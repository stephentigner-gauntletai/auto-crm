import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow, formatBytes } from '@/lib/utils';
import { useAttachments } from '@/hooks/tickets/useAttachments';
import { Loader2, Upload, X, Download } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface AttachmentsProps {
	ticketId: string;
}

export function Attachments({ ticketId }: AttachmentsProps) {
	const [isUploading, setIsUploading] = useState(false);
	const { attachments, isLoading, error, uploadFile, deleteFile, getDownloadUrl } =
		useAttachments(ticketId);
	const { toast } = useToast();

	const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		try {
			setIsUploading(true);
			await uploadFile(file);
			toast({
				title: 'File uploaded',
				description: `${file.name} has been uploaded successfully.`,
			});
		} catch (error) {
			toast({
				title: 'Upload failed',
				description: error instanceof Error ? error.message : 'Failed to upload file',
				variant: 'destructive',
			});
		} finally {
			setIsUploading(false);
			// Reset the input
			event.target.value = '';
		}
	};

	const handleDelete = async (attachmentId: string, fileName: string) => {
		try {
			await deleteFile(attachmentId);
			toast({
				title: 'File deleted',
				description: `${fileName} has been deleted.`,
			});
		} catch (error) {
			toast({
				title: 'Delete failed',
				description: error instanceof Error ? error.message : 'Failed to delete file',
				variant: 'destructive',
			});
		}
	};

	const handleDownload = async (storagePath: string, fileName: string) => {
		try {
			const url = await getDownloadUrl(storagePath);
			// Create a temporary link and click it
			const link = document.createElement('a');
			link.href = url;
			link.download = fileName;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		} catch (error) {
			toast({
				title: 'Download failed',
				description: error instanceof Error ? error.message : 'Failed to download file',
				variant: 'destructive',
			});
		}
	};

	if (error) {
		return <div className="p-4 text-red-500">Error loading attachments: {error}</div>;
	}

	return (
		<div className="space-y-4">
			<Card>
				<CardHeader>
					<CardTitle>Attachments</CardTitle>
				</CardHeader>
				<CardContent>
					<ScrollArea className="h-[300px] pr-4">
						{isLoading ? (
							<div className="flex justify-center items-center h-full">
								<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
							</div>
						) : attachments.length === 0 ? (
							<div className="flex flex-col items-center justify-center h-full text-muted-foreground">
								<Upload className="h-8 w-8 mb-2" />
								<p>No attachments yet</p>
							</div>
						) : (
							<div className="space-y-4">
								{attachments.map((attachment) => (
									<div
										key={attachment.id}
										className="flex items-center gap-3 p-3 rounded-lg bg-muted/10"
									>
										<Avatar className="h-8 w-8">
											<AvatarImage
												src={attachment.user.avatar_url}
												alt={attachment.user.full_name}
											/>
											<AvatarFallback>
												{attachment.user.full_name
													.split(' ')
													.map((n) => n[0])
													.join('')}
											</AvatarFallback>
										</Avatar>
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2">
												<span className="font-medium truncate">
													{attachment.file_name}
												</span>
												<span className="text-sm text-muted-foreground">
													({formatBytes(attachment.file_size)})
												</span>
											</div>
											<div className="flex items-center gap-2 text-sm text-muted-foreground">
												<span>{attachment.user.full_name}</span>
												<span>•</span>
												<span>
													{formatDistanceToNow(
														new Date(attachment.created_at!),
														{
															addSuffix: true,
														}
													)}
												</span>
											</div>
										</div>
										<div className="flex items-center gap-2">
											<Button
												variant="ghost"
												size="icon"
												onClick={() =>
													handleDownload(
														attachment.storage_path,
														attachment.file_name
													)
												}
											>
												<Download className="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												onClick={() =>
													handleDelete(
														attachment.id,
														attachment.file_name
													)
												}
											>
												<X className="h-4 w-4" />
											</Button>
										</div>
									</div>
								))}
							</div>
						)}
					</ScrollArea>
				</CardContent>
				<CardFooter>
					<div className="w-full">
						<input
							type="file"
							id="file-upload"
							className="hidden"
							onChange={handleFileChange}
							disabled={isUploading}
						/>
						<label htmlFor="file-upload">
							<Button
								className="w-full"
								variant="outline"
								disabled={isUploading}
								asChild
							>
								<span>
									{isUploading ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Uploading...
										</>
									) : (
										<>
											<Upload className="mr-2 h-4 w-4" />
											Upload File
										</>
									)}
								</span>
							</Button>
						</label>
					</div>
				</CardFooter>
			</Card>
		</div>
	);
}
