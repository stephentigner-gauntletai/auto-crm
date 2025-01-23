import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Plus, ArrowDown, X } from 'lucide-react';
import type {
	WorkflowStepType,
	WorkflowStep,
	ConditionStep,
	ActionStep,
	DelayStep,
	NotificationStep,
} from '@/lib/workflows/types';
import { ValidationError } from '@/components/ui/validation-error';
import { FieldSuggestions } from '@/components/ui/field-suggestions';
import {
	getFieldSuggestions,
	getOperatorSuggestions,
	getValueSuggestions,
} from '@/lib/workflows/suggestions';
import type { FieldSuggestion } from '@/lib/workflows/suggestions';
import { useWorkflow } from '@/lib/contexts/workflow';

interface StepEditorProps {
	steps: WorkflowStep[];
	onChange: (steps: WorkflowStep[]) => void;
	validationErrors?: {
		field: string;
		message: string;
	}[];
}

const stepTypes = [
	{ value: 'condition' as const, label: 'Condition' },
	{ value: 'action' as const, label: 'Action' },
	{ value: 'delay' as const, label: 'Delay' },
	{ value: 'notification' as const, label: 'Notification' },
] as const;

function getDefaultConfig(type: 'condition'): ConditionStep['config'];
function getDefaultConfig(type: 'action'): ActionStep['config'];
function getDefaultConfig(type: 'delay'): DelayStep['config'];
function getDefaultConfig(type: 'notification'): NotificationStep['config'];
function getDefaultConfig(
	type: WorkflowStepType
):
	| ConditionStep['config']
	| ActionStep['config']
	| DelayStep['config']
	| NotificationStep['config'] {
	switch (type) {
		case 'condition':
			return {
				field: '',
				operator: 'equals',
				value: '',
			};
		case 'action':
			return {
				action: 'update_ticket',
				field: undefined,
				value: undefined,
			};
		case 'delay':
			return {
				duration: 60,
				unit: 'minutes',
			};
		case 'notification':
			return {
				type: 'email',
				template: '',
				recipients: [],
			};
	}
}

export function StepEditor({ steps, onChange, validationErrors = [] }: StepEditorProps) {
	const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

	const getStepErrors = (stepId: string) => {
		return validationErrors.filter((error) => error.field === `step_${stepId}`);
	};

	const addStep = (type: WorkflowStepType) => {
		const baseStep = {
			id: crypto.randomUUID(),
			nextSteps: [] as string[],
			isStart: steps.length === 0, // First step is a start step
		};

		let newStep: WorkflowStep;
		switch (type) {
			case 'condition': {
				const config = getDefaultConfig('condition');
				newStep = {
					...baseStep,
					type: 'condition',
					config,
					alternateSteps: [],
				} as ConditionStep;
				break;
			}
			case 'action': {
				const config = getDefaultConfig('action');
				newStep = {
					...baseStep,
					type: 'action',
					config,
				} as ActionStep;
				break;
			}
			case 'delay': {
				const config = getDefaultConfig('delay');
				newStep = {
					...baseStep,
					type: 'delay',
					config,
				} as DelayStep;
				break;
			}
			case 'notification': {
				const config = getDefaultConfig('notification');
				newStep = {
					...baseStep,
					type: 'notification',
					config,
				} as NotificationStep;
				break;
			}
		}

		const newSteps: WorkflowStep[] = [...steps, newStep];
		onChange(newSteps);
		setSelectedStepId(newStep.id);
	};

	const updateStep = (
		stepId: string,
		updates: Partial<{
			nextSteps: string[];
			isStart: boolean;
			config:
				| ConditionStep['config']
				| ActionStep['config']
				| DelayStep['config']
				| NotificationStep['config'];
		}>
	) => {
		const stepToUpdate = steps.find((step) => step.id === stepId);
		if (!stepToUpdate) return;

		onChange(
			steps.map((step) => {
				if (step.id !== stepId) return step;

				switch (step.type) {
					case 'condition':
						return {
							...(step as ConditionStep),
							...updates,
						} as ConditionStep;
					case 'action':
						return {
							...(step as ActionStep),
							...updates,
						} as ActionStep;
					case 'delay':
						return {
							...(step as DelayStep),
							...updates,
						} as DelayStep;
					case 'notification':
						return {
							...(step as NotificationStep),
							...updates,
						} as NotificationStep;
					default:
						return step;
				}
			})
		);
	};

	const removeStep = (stepId: string) => {
		onChange(
			steps
				.map((step) => ({
					...step,
					nextSteps: step.nextSteps.filter((id) => id !== stepId),
				}))
				.filter((step) => step.id !== stepId)
		);
		if (selectedStepId === stepId) {
			setSelectedStepId(null);
		}
	};

	// TODO: Implement UI for connecting workflow steps visually
	// This function will be used to create connections between steps in the workflow diagram
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const connectSteps = (fromId: string, toId: string) => {
		onChange(
			steps.map((step) =>
				step.id === fromId
					? {
							...step,
							nextSteps: [...step.nextSteps, toId],
						}
					: step
			)
		);
	};

	return (
		<div className="space-y-6">
			<div className="flex justify-end space-x-2">
				{stepTypes.map((type) => (
					<Button key={type.value} variant="outline" onClick={() => addStep(type.value)}>
						<Plus className="w-4 h-4 mr-2" />
						Add {type.label}
					</Button>
				))}
			</div>

			<div className="space-y-4">
				{steps.map((step) => (
					<Card
						key={step.id}
						className={selectedStepId === step.id ? 'border-primary' : undefined}
					>
						<CardContent className="pt-6">
							<div className="flex items-start justify-between">
								<div className="space-y-4 flex-1">
									<StepConfig
										step={step}
										onChange={(updates) => updateStep(step.id, updates)}
										validationErrors={validationErrors}
									/>

									{getStepErrors(step.id).map((error, index) => (
										<ValidationError key={index} message={error.message} />
									))}

									{step.nextSteps.length > 0 && (
										<div className="pt-4">
											<Label>Next Steps</Label>
											<div className="flex flex-wrap gap-2 mt-2">
												{step.nextSteps.map((nextStepId) => {
													const nextStep = steps.find(
														(s) => s.id === nextStepId
													);
													return (
														nextStep && (
															<div
																key={nextStepId}
																className="flex items-center"
															>
																<ArrowDown className="w-4 h-4 mr-2" />
																<span>{nextStep.type}</span>
															</div>
														)
													);
												})}
											</div>
										</div>
									)}
								</div>

								<Button
									variant="ghost"
									size="icon"
									onClick={() => removeStep(step.id)}
								>
									<X className="w-4 h-4" />
								</Button>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}

interface StepConfigProps {
	step: WorkflowStep;
	onChange: (updates: Partial<WorkflowStep>) => void;
	validationErrors?: {
		field: string;
		message: string;
	}[];
}

function StepConfig({ step, onChange, validationErrors = [] }: StepConfigProps) {
	switch (step.type) {
		case 'condition': {
			const conditionStep = step as ConditionStep;
			return (
				<ConditionConfig
					config={conditionStep.config}
					onChange={(config) => onChange({ config })}
					stepId={step.id}
					validationErrors={validationErrors}
				/>
			);
		}
		case 'action': {
			const actionStep = step as ActionStep;
			return (
				<ActionConfig
					config={actionStep.config}
					onChange={(config) => onChange({ config })}
					stepId={step.id}
					validationErrors={validationErrors}
				/>
			);
		}
		case 'delay': {
			const delayStep = step as DelayStep;
			return (
				<DelayConfig
					config={delayStep.config}
					onChange={(config) => onChange({ config })}
					stepId={step.id}
					validationErrors={validationErrors}
				/>
			);
		}
		case 'notification': {
			const notificationStep = step as NotificationStep;
			return (
				<NotificationConfig
					config={notificationStep.config}
					onChange={(config) => onChange({ config })}
					stepId={step.id}
					validationErrors={validationErrors}
				/>
			);
		}
		default:
			return null;
	}
}

interface ConditionConfigProps {
	config: ConditionStep['config'];
	onChange: (config: ConditionStep['config']) => void;
	stepId: string;
	validationErrors?: {
		field: string;
		message: string;
	}[];
}

function ConditionConfig({
	config,
	onChange,
	stepId,
	validationErrors = [],
}: ConditionConfigProps) {
	const [selectedField, setSelectedField] = useState<FieldSuggestion | null>(null);
	const { triggerType } = useWorkflow();

	const fieldSuggestions = getFieldSuggestions(triggerType, '');
	const operatorSuggestions = selectedField ? getOperatorSuggestions(selectedField.type) : [];
	const valueSuggestions = selectedField
		? getValueSuggestions(selectedField, config.operator)
		: [];

	const handleFieldChange = (path: string) => {
		const field = fieldSuggestions.find((f) => f.path === path);
		setSelectedField(field || null);
		onChange({ ...config, field: path });
	};

	return (
		<div className="space-y-4">
			<div>
				<Label>Field</Label>
				<FieldSuggestions
					suggestions={fieldSuggestions}
					value={config.field}
					onChange={handleFieldChange}
					className={
						validationErrors.some((e) => e.field === `${stepId}.field`)
							? 'border-destructive'
							: ''
					}
				/>
				{validationErrors
					.filter((e) => e.field === `${stepId}.field`)
					.map((error, index) => (
						<ValidationError key={index} message={error.message} />
					))}
			</div>

			<div>
				<Label>Operator</Label>
				<Select
					value={config.operator}
					onValueChange={(operator) =>
						onChange({
							...config,
							operator: operator as ConditionStep['config']['operator'],
						})
					}
				>
					<SelectTrigger
						className={
							validationErrors.some((e) => e.field === `${stepId}.operator`)
								? 'border-destructive'
								: ''
						}
					>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{operatorSuggestions.map((operator) => (
							<SelectItem key={operator} value={operator}>
								{operator.replace(/_/g, ' ')}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{validationErrors
					.filter((e) => e.field === `${stepId}.operator`)
					.map((error, index) => (
						<ValidationError key={index} message={error.message} />
					))}
			</div>

			<div>
				<Label>Value</Label>
				{valueSuggestions.length > 0 ? (
					<Select
						value={config.value}
						onValueChange={(value) => onChange({ ...config, value })}
					>
						<SelectTrigger
							className={
								validationErrors.some((e) => e.field === `${stepId}.value`)
									? 'border-destructive'
									: ''
							}
						>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{valueSuggestions.map((value) => (
								<SelectItem key={value} value={value}>
									{value}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				) : (
					<Input
						value={config.value}
						onChange={(e) => onChange({ ...config, value: e.target.value })}
						placeholder={selectedField?.example || 'Value to compare'}
						className={
							validationErrors.some((e) => e.field === `${stepId}.value`)
								? 'border-destructive'
								: ''
						}
					/>
				)}
				{validationErrors
					.filter((e) => e.field === `${stepId}.value`)
					.map((error, index) => (
						<ValidationError key={index} message={error.message} />
					))}
			</div>
		</div>
	);
}

interface ActionConfigProps {
	config: ActionStep['config'];
	onChange: (config: ActionStep['config']) => void;
	stepId: string;
	validationErrors?: {
		field: string;
		message: string;
	}[];
}

function ActionConfig({ config, onChange, stepId, validationErrors = [] }: ActionConfigProps) {
	const [selectedField, setSelectedField] = useState<FieldSuggestion | null>(null);
	const { triggerType } = useWorkflow();

	const fieldSuggestions = getFieldSuggestions(triggerType, '');
	const valueSuggestions = selectedField ? getValueSuggestions(selectedField, 'equals') : [];

	const handleFieldChange = (path: string) => {
		const field = fieldSuggestions.find((f) => f.path === path);
		setSelectedField(field || null);
		onChange({ ...config, field: path });
	};

	return (
		<div className="space-y-4">
			<div>
				<Label>Action</Label>
				<Select
					value={config.action}
					onValueChange={(action) =>
						onChange({ ...config, action: action as ActionStep['config']['action'] })
					}
				>
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
						<SelectItem value="update_ticket">Update Ticket</SelectItem>
						<SelectItem value="assign_ticket">Assign Ticket</SelectItem>
						<SelectItem value="close_ticket">Close Ticket</SelectItem>
					</SelectContent>
				</Select>
				{validationErrors
					.filter((e) => e.field === `${stepId}.action`)
					.map((error, index) => (
						<ValidationError key={index} message={error.message} />
					))}
			</div>

			{config.action === 'update_ticket' && (
				<>
					<div>
						<Label>Field</Label>
						<FieldSuggestions
							suggestions={fieldSuggestions}
							value={config.field ?? ''}
							onChange={handleFieldChange}
							className={
								validationErrors.some((e) => e.field === `${stepId}.field`)
									? 'border-destructive'
									: ''
							}
						/>
						{validationErrors
							.filter((e) => e.field === `${stepId}.field`)
							.map((error, index) => (
								<ValidationError key={index} message={error.message} />
							))}
					</div>
					<div>
						<Label>Value</Label>
						{valueSuggestions.length > 0 ? (
							<Select
								value={config.value ?? ''}
								onValueChange={(value) => onChange({ ...config, value })}
							>
								<SelectTrigger
									className={
										validationErrors.some((e) => e.field === `${stepId}.value`)
											? 'border-destructive'
											: ''
									}
								>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{valueSuggestions.map((value) => (
										<SelectItem key={value} value={value}>
											{value}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						) : (
							<Input
								value={config.value ?? ''}
								onChange={(e) => onChange({ ...config, value: e.target.value })}
								placeholder={selectedField?.example || 'New value'}
								className={
									validationErrors.some((e) => e.field === `${stepId}.value`)
										? 'border-destructive'
										: ''
								}
							/>
						)}
						{validationErrors
							.filter((e) => e.field === `${stepId}.value`)
							.map((error, index) => (
								<ValidationError key={index} message={error.message} />
							))}
					</div>
				</>
			)}
		</div>
	);
}

interface DelayConfigProps {
	config: DelayStep['config'];
	onChange: (config: DelayStep['config']) => void;
	stepId: string;
	validationErrors?: {
		field: string;
		message: string;
	}[];
}

function DelayConfig({ config, onChange, stepId, validationErrors = [] }: DelayConfigProps) {
	return (
		<div className="space-y-4">
			<div>
				<Label>Duration</Label>
				<Input
					type="number"
					value={config.duration}
					onChange={(e) =>
						onChange({ ...config, duration: parseInt(e.target.value, 10) })
					}
					placeholder="Duration"
					className={
						validationErrors.some((e) => e.field === `${stepId}.duration`)
							? 'border-destructive'
							: ''
					}
				/>
				{validationErrors
					.filter((e) => e.field === `${stepId}.duration`)
					.map((error, index) => (
						<ValidationError key={index} message={error.message} />
					))}
			</div>

			<div>
				<Label>Unit</Label>
				<Select
					value={config.unit}
					onValueChange={(unit) =>
						onChange({ ...config, unit: unit as DelayStep['config']['unit'] })
					}
				>
					<SelectTrigger
						className={
							validationErrors.some((e) => e.field === `${stepId}.unit`)
								? 'border-destructive'
								: ''
						}
					>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="seconds">Seconds</SelectItem>
						<SelectItem value="minutes">Minutes</SelectItem>
						<SelectItem value="hours">Hours</SelectItem>
						<SelectItem value="days">Days</SelectItem>
					</SelectContent>
				</Select>
				{validationErrors
					.filter((e) => e.field === `${stepId}.unit`)
					.map((error, index) => (
						<ValidationError key={index} message={error.message} />
					))}
			</div>
		</div>
	);
}

interface NotificationConfigProps {
	config: NotificationStep['config'];
	onChange: (config: NotificationStep['config']) => void;
	stepId: string;
	validationErrors?: {
		field: string;
		message: string;
	}[];
}

function NotificationConfig({
	config,
	onChange,
	stepId,
	validationErrors = [],
}: NotificationConfigProps) {
	const [showVariables, setShowVariables] = useState(false);

	const templateVariables = [
		{ path: 'ticket.id', description: 'The ticket ID', example: '123' },
		{ path: 'ticket.title', description: 'The ticket title', example: 'Need help with login' },
		{
			path: 'ticket.description',
			description: 'The ticket description',
			example: 'I cannot log into my account',
		},
		{ path: 'ticket.status', description: 'The ticket status', example: 'open' },
		{ path: 'ticket.priority', description: 'The ticket priority', example: 'high' },
		{
			path: 'ticket.assignee',
			description: 'The assigned agent',
			example: 'john.doe@company.com',
		},
		{
			path: 'ticket.customer',
			description: 'The customer email',
			example: 'customer@example.com',
		},
		{
			path: 'ticket.created_at',
			description: 'When the ticket was created',
			example: '2024-03-20T10:00:00Z',
		},
		{
			path: 'ticket.updated_at',
			description: 'When the ticket was last updated',
			example: '2024-03-20T10:30:00Z',
		},
		{
			path: 'workflow.name',
			description: 'The workflow name',
			example: 'High Priority Escalation',
		},
		{
			path: 'workflow.step',
			description: 'The current step name',
			example: 'Send notification',
		},
		{
			path: 'workflow.trigger',
			description: 'What triggered the workflow',
			example: 'Ticket priority changed to high',
		},
	];

	const insertVariable = (variable: string) => {
		const cursorPosition =
			(document.activeElement as HTMLTextAreaElement)?.selectionStart ||
			config.template.length;
		const newTemplate =
			config.template.slice(0, cursorPosition) +
			'${' +
			variable +
			'}' +
			config.template.slice(cursorPosition);
		onChange({ ...config, template: newTemplate });
	};

	return (
		<div className="space-y-4">
			<div>
				<Label>Type</Label>
				<Select
					value={config.type}
					onValueChange={(type) =>
						onChange({ ...config, type: type as NotificationStep['config']['type'] })
					}
				>
					<SelectTrigger
						className={
							validationErrors.some((e) => e.field === `${stepId}.type`)
								? 'border-destructive'
								: ''
						}
					>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="email">Email</SelectItem>
						<SelectItem value="in_app">In-App</SelectItem>
						<SelectItem value="webhook">Webhook</SelectItem>
					</SelectContent>
				</Select>
				{validationErrors
					.filter((e) => e.field === `${stepId}.type`)
					.map((error, index) => (
						<ValidationError key={index} message={error.message} />
					))}
			</div>

			<div>
				<div className="flex justify-between items-center mb-2">
					<Label>Template</Label>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setShowVariables(!showVariables)}
					>
						{showVariables ? 'Hide Variables' : 'Show Variables'}
					</Button>
				</div>
				{showVariables && (
					<div className="mb-2 p-4 border rounded-md bg-muted">
						<div className="text-sm font-medium mb-2">Available Variables:</div>
						<div className="grid grid-cols-2 gap-2">
							{templateVariables.map((variable) => (
								<Button
									key={variable.path}
									variant="ghost"
									size="sm"
									className="justify-start h-auto py-1 px-2"
									onClick={() => insertVariable(variable.path)}
								>
									<div className="text-left">
										<div className="font-mono text-xs">
											${'{' + variable.path + '}'}
										</div>
										<div className="text-xs text-muted-foreground">
											{variable.description}
										</div>
									</div>
								</Button>
							))}
						</div>
					</div>
				)}
				<Input
					value={config.template}
					onChange={(e) => onChange({ ...config, template: e.target.value })}
					placeholder="Use ${variable.path} for dynamic content"
					className={
						validationErrors.some((e) => e.field === `${stepId}.template`)
							? 'border-destructive'
							: ''
					}
				/>
				{validationErrors
					.filter((e) => e.field === `${stepId}.template`)
					.map((error, index) => (
						<ValidationError key={index} message={error.message} />
					))}
			</div>

			<div>
				<Label>Recipients</Label>
				<Input
					value={config.recipients.join(', ')}
					onChange={(e) =>
						onChange({
							...config,
							recipients: e.target.value.split(',').map((r) => r.trim()),
						})
					}
					placeholder="Comma-separated list of recipients"
					className={
						validationErrors.some((e) => e.field === `${stepId}.recipients`)
							? 'border-destructive'
							: ''
					}
				/>
				{validationErrors
					.filter((e) => e.field === `${stepId}.recipients`)
					.map((error, index) => (
						<ValidationError key={index} message={error.message} />
					))}
			</div>
		</div>
	);
}
