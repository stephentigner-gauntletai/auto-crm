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
	return (
		<div className="space-y-4">
			<div>
				<Label>Field</Label>
				<Input
					value={config.field}
					onChange={(e) => onChange({ ...config, field: e.target.value })}
					placeholder="ticket.status"
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
						<SelectItem value="equals">Equals</SelectItem>
						<SelectItem value="not_equals">Not Equals</SelectItem>
						<SelectItem value="contains">Contains</SelectItem>
						<SelectItem value="greater_than">Greater Than</SelectItem>
						<SelectItem value="less_than">Less Than</SelectItem>
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
				<Input
					value={config.value}
					onChange={(e) => onChange({ ...config, value: e.target.value })}
					placeholder="Value to compare"
					className={
						validationErrors.some((e) => e.field === `${stepId}.value`)
							? 'border-destructive'
							: ''
					}
				/>
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
						<Input
							value={config.field ?? ''}
							onChange={(e) => onChange({ ...config, field: e.target.value })}
							placeholder="Field to update"
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
						<Input
							value={config.value ?? ''}
							onChange={(e) => onChange({ ...config, value: e.target.value })}
							placeholder="New value"
							className={
								validationErrors.some((e) => e.field === `${stepId}.value`)
									? 'border-destructive'
									: ''
							}
						/>
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
				<Label>Template</Label>
				<Input
					value={config.template}
					onChange={(e) => onChange({ ...config, template: e.target.value })}
					placeholder="Notification template"
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
