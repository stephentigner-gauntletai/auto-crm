import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface JsonEditorProps {
	value: unknown;
	onChange: (value: unknown) => void;
	className?: string;
}

export function JsonEditor({ value, onChange, className }: JsonEditorProps) {
	const [text, setText] = useState('');
	const [error, setError] = useState<string | null>(null);

	// Update text when value changes
	useEffect(() => {
		try {
			setText(JSON.stringify(value, null, 2));
		} catch {
			setText('');
		}
	}, [value]);

	// Handle text changes
	const handleChange = (newText: string) => {
		setText(newText);
		try {
			const parsed = JSON.parse(newText);
			onChange(parsed);
			setError(null);
		} catch {
			setError('Invalid JSON');
		}
	};

	return (
		<div className="space-y-1">
			<Textarea
				value={text}
				onChange={(e) => handleChange(e.target.value)}
				className={cn('font-mono text-sm', className)}
				rows={5}
			/>
			{error && <p className="text-sm text-destructive">{error}</p>}
		</div>
	);
}
