import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { FieldSuggestion } from '@/lib/workflows/suggestions';

interface FieldSuggestionsProps {
	suggestions: FieldSuggestion[];
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	className?: string;
}

export function FieldSuggestions({
	suggestions,
	value,
	onChange,
	placeholder = 'Select field...',
	className,
}: FieldSuggestionsProps) {
	const [open, setOpen] = React.useState(false);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className={cn('w-full justify-between', className)}
				>
					{value
						? (suggestions.find((field) => field.path === value)?.path ?? value)
						: placeholder}
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[400px] p-0">
				<Command>
					<CommandInput placeholder="Search fields..." />
					<CommandEmpty>No field found.</CommandEmpty>
					<CommandGroup>
						{suggestions.map((field) => (
							<CommandItem
								key={field.path}
								value={field.path}
								onSelect={() => {
									onChange(field.path);
									setOpen(false);
								}}
							>
								<Check
									className={cn(
										'mr-2 h-4 w-4',
										value === field.path ? 'opacity-100' : 'opacity-0'
									)}
								/>
								<div className="flex flex-col">
									<div>{field.path}</div>
									<div className="text-sm text-muted-foreground">
										{field.description}
									</div>
								</div>
							</CommandItem>
						))}
					</CommandGroup>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
