import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { ValidationError } from '@/components/ui/validation-error';
import { customActions } from '@/lib/workflows/actions/custom';
import type { CustomActionConfig } from '@/lib/workflows/actions/custom';
import { JsonEditor } from './JsonEditor';

interface CustomActionConfigProps {
	config: {
		action: string;
		parameters: Record<string, unknown>;
	};
	onChange: (config: { action: string; parameters: Record<string, unknown> }) => void;
	stepId: string;
	validationErrors?: Array<{ field: string; message: string }>;
}

export function CustomActionConfig({
	config,
	onChange,
	stepId,
	validationErrors = [],
}: CustomActionConfigProps) {
	// Get all available actions
	const availableActions = customActions.list();

	// Get the currently selected action
	const selectedAction = availableActions.find((a) => a.config.name === config.action);

	// Update the action selection
	const handleActionChange = (actionName: string) => {
		const action = availableActions.find((a) => a.config.name === actionName);
		if (!action) return;

		// Initialize parameters with default values
		const parameters: Record<string, unknown> = {};
		Object.entries(action.config.parameters).forEach(([key, param]) => {
			if ('default' in param) {
				parameters[key] = param.default;
			}
		});

		onChange({
			action: actionName,
			parameters,
		});
	};

	// Update a parameter value
	const handleParameterChange = (key: string, value: unknown) => {
		onChange({
			...config,
			parameters: {
				...config.parameters,
				[key]: value,
			},
		});
	};

	// Render parameter input based on type
	const renderParameterInput = (
		key: string,
		paramConfig: CustomActionConfig['parameters'][string]
	) => {
		const value = config.parameters[key];
		const hasError = validationErrors.some((e) => e.field === `${stepId}.parameters.${key}`);

		switch (paramConfig.type) {
			case 'string':
				if (
					key.toLowerCase().includes('message') ||
					key.toLowerCase().includes('description')
				) {
					return (
						<Textarea
							value={value as string}
							onChange={(e) => handleParameterChange(key, e.target.value)}
							placeholder={paramConfig.description}
							className={hasError ? 'border-destructive' : ''}
						/>
					);
				}
				return (
					<Input
						value={value as string}
						onChange={(e) => handleParameterChange(key, e.target.value)}
						placeholder={paramConfig.description}
						className={hasError ? 'border-destructive' : ''}
					/>
				);
			case 'number':
				return (
					<Input
						type="number"
						value={value as number}
						onChange={(e) => handleParameterChange(key, Number(e.target.value))}
						placeholder={paramConfig.description}
						className={hasError ? 'border-destructive' : ''}
					/>
				);
			case 'boolean':
				return (
					<Switch
						checked={value as boolean}
						onCheckedChange={(checked) => handleParameterChange(key, checked)}
					/>
				);
			case 'object':
			case 'array':
				return (
					<JsonEditor
						value={value}
						onChange={(newValue: unknown) => handleParameterChange(key, newValue)}
						className={hasError ? 'border-destructive' : ''}
					/>
				);
			default:
				return null;
		}
	};

	return (
		<div className="space-y-4">
			<div>
				<Label>Action</Label>
				<Select value={config.action} onValueChange={handleActionChange}>
					<SelectTrigger
						className={
							validationErrors.some((e) => e.field === `${stepId}.action`)
								? 'border-destructive'
								: ''
						}
					>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{availableActions.map((action) => (
							<SelectItem key={action.config.name} value={action.config.name}>
								{action.config.description}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{validationErrors
					.filter((e) => e.field === `${stepId}.action`)
					.map((error, index) => (
						<ValidationError key={index} message={error.message} />
					))}
			</div>

			{selectedAction && (
				<div className="space-y-4">
					{Object.entries(selectedAction.config.parameters).map(([key, param]) => (
						<div key={key}>
							<Label>
								{key}
								{param.required && <span className="text-destructive"> *</span>}
							</Label>
							<div className="mt-1.5">{renderParameterInput(key, param)}</div>
							{validationErrors
								.filter((e) => e.field === `${stepId}.parameters.${key}`)
								.map((error, index) => (
									<ValidationError key={index} message={error.message} />
								))}
						</div>
					))}
				</div>
			)}
		</div>
	);
}
