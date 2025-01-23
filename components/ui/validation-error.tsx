import { AlertCircle } from 'lucide-react';

interface ValidationErrorProps {
	message: string;
}

export function ValidationError({ message }: ValidationErrorProps) {
	return (
		<div className="flex items-center gap-2 text-sm text-destructive mt-1">
			<AlertCircle className="w-4 h-4" />
			<span>{message}</span>
		</div>
	);
}
