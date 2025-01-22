import { useForm } from 'react-hook-form';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { useMessages } from '@/hooks/tickets/useMessages';
import { Loader2 } from 'lucide-react';

interface ConversationProps {
	ticketId: string;
}

export function TicketConversation({ ticketId }: ConversationProps) {
	const { messages, isLoading, error, sendMessage } = useMessages(ticketId);
	const {
		register,
		handleSubmit,
		reset,
		formState: { isSubmitting },
	} = useForm<{
		content: string;
	}>();

	const onSubmit = async (data: { content: string }) => {
		try {
			await sendMessage(data.content);
			reset();
		} catch (error) {
			console.error('Error sending message:', error);
		}
	};

	if (error) {
		return <div className="p-4 text-red-500">Error loading messages: {error}</div>;
	}

	return (
		<div className="space-y-4">
			<Card>
				<CardHeader>
					<CardTitle>Conversation</CardTitle>
				</CardHeader>
				<CardContent>
					<ScrollArea className="h-[400px] pr-4">
						{isLoading ? (
							<div className="flex justify-center items-center h-full">
								<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
							</div>
						) : (
							<div className="space-y-4">
								{messages.map((message) => (
									<div
										key={message.id}
										className="flex gap-3 p-3 rounded-lg bg-muted/10"
									>
										<Avatar className="h-8 w-8">
											<AvatarImage
												src={message.user.avatar_url}
												alt={message.user.full_name}
											/>
											<AvatarFallback>
												{message.user.full_name
													.split(' ')
													.map((n) => n[0])
													.join('')}
											</AvatarFallback>
										</Avatar>
										<div className="flex-1 space-y-1">
											<div className="flex items-center gap-2">
												<span className="font-medium">
													{message.user.full_name}
												</span>
												<span className="text-sm text-muted-foreground">
													{formatDistanceToNow(
														new Date(message.created_at),
														{
															addSuffix: true,
														}
													)}
												</span>
											</div>
											<p className="text-sm whitespace-pre-wrap">
												{message.content}
											</p>
										</div>
									</div>
								))}
							</div>
						)}
					</ScrollArea>
				</CardContent>
				<CardFooter>
					<form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-3">
						<Textarea
							{...register('content', { required: true })}
							placeholder="Type your message..."
							className="min-h-[100px]"
						/>
						<div className="flex justify-end">
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting ? 'Sending...' : 'Send'}
							</Button>
						</div>
					</form>
				</CardFooter>
			</Card>
		</div>
	);
}
