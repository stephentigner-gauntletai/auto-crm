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
	ConditionConfig,
	ActionConfig,
	DelayConfig,
	NotificationConfig,
	WorkflowStep,
} from '@/lib/workflows/types';

interface StepEditorProps {
	steps: WorkflowStep[];
	onChange: (steps: WorkflowStep[]) => void;
}

const stepTypes = [
	{ value: 'condition' as const, label: 'Condition' },
	{ value: 'action' as const, label: 'Action' },
	{ value: 'delay' as const, label: 'Delay' },
	{ value: 'notification' as const, label: 'Notification' },
] as const;

function getDefaultConfig(type: 'condition'): ConditionConfig;
function getDefaultConfig(type: 'action'): ActionConfig;
function getDefaultConfig(type: 'delay'): DelayConfig;
function getDefaultConfig(type: 'notification'): NotificationConfig;
function getDefaultConfig(
	type: WorkflowStepType
): ConditionConfig | ActionConfig | DelayConfig | NotificationConfig {
	switch (type) {
		case 'condition':
			const conditionConfig: ConditionConfig = {
				operator: 'equals',
				field: '',
				value: '',
			};
			return conditionConfig;
		case 'action':
			const actionConfig: ActionConfig = {
				action: 'update_ticket',
				field: undefined,
				value: undefined,
			};
			return actionConfig;
		case 'delay':
			const delayConfig: DelayConfig = {
				duration: 60,
				unit: 'minutes',
			};
			return delayConfig;
		case 'notification':
			const notificationConfig: NotificationConfig = {
				type: 'email',
				template: '',
				recipients: [],
			};
			return notificationConfig;
	}
}

export function StepEditor({ steps, onChange }: StepEditorProps) {
	const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

	const addStep = (type: WorkflowStepType) => {
		const baseStep = {
			id: crypto.randomUUID(),
			nextSteps: [] as string[],
		};

		let newStep: WorkflowStep;
		switch (type) {
			case 'condition': {
				const config = getDefaultConfig('condition');
				newStep = {
					...baseStep,
					type: 'condition',
					config,
				};
				break;
			}
			case 'action': {
				const config = getDefaultConfig('action');
				newStep = {
					...baseStep,
					type: 'action',
					config,
				};
				break;
			}
			case 'delay': {
				const config = getDefaultConfig('delay');
				newStep = {
					...baseStep,
					type: 'delay',
					config,
				};
				break;
			}
			case 'notification': {
				const config = getDefaultConfig('notification');
				newStep = {
					...baseStep,
					type: 'notification',
					config,
				};
				break;
			}
		}

		const newSteps: WorkflowStep[] = [...steps, newStep];
		onChange(newSteps);
		setSelectedStepId(newStep.id);
	};

	const updateStep = (
		stepId: string,
		updates: Partial<Omit<WorkflowStep, 'type' | 'config'>> & {
			config?: WorkflowStep['config'];
		}
	) => {
		const stepToUpdate = steps.find((step) => step.id === stepId);
		if (!stepToUpdate) return;

		onChange(
			steps.map((step) =>
				step.id === stepId ? ({ ...step, ...updates } as WorkflowStep) : step
			)
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
									/>

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
	onChange: (updates: Partial<Omit<WorkflowStep, 'type'>>) => void;
}

function StepConfig({ step, onChange }: StepConfigProps) {
	switch (step.type) {
		case 'condition':
			return (
				<ConditionConfig config={step.config} onChange={(config) => onChange({ config })} />
			);
		case 'action':
			return (
				<ActionConfig config={step.config} onChange={(config) => onChange({ config })} />
			);
		case 'delay':
			return <DelayConfig config={step.config} onChange={(config) => onChange({ config })} />;
		case 'notification':
			return (
				<NotificationConfig
					config={step.config}
					onChange={(config) => onChange({ config })}
				/>
			);
		default:
			return null;
	}
}

interface ConditionConfigProps {
	config: ConditionConfig;
	onChange: (config: ConditionConfig) => void;
}

function ConditionConfig({ config, onChange }: ConditionConfigProps) {
	return (
		<div className="space-y-4">
			<div>
				<Label>Field</Label>
				<Input
					value={config.field}
					onChange={(e) => onChange({ ...config, field: e.target.value })}
					placeholder="ticket.status"
				/>
			</div>

			<div>
				<Label>Operator</Label>
				<Select
					value={config.operator}
					onValueChange={(operator) =>
						onChange({ ...config, operator: operator as ConditionConfig['operator'] })
					}
				>
					<SelectTrigger>
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
			</div>

			<div>
				<Label>Value</Label>
				<Input
					value={config.value}
					onChange={(e) => onChange({ ...config, value: e.target.value })}
					placeholder="Value to compare"
				/>
			</div>
		</div>
	);
}

interface ActionConfigProps {
	config: ActionConfig;
	onChange: (config: ActionConfig) => void;
}

function ActionConfig({ config, onChange }: ActionConfigProps) {
	return (
		<div className="space-y-4">
			<div>
				<Label>Action</Label>
				<Select
					value={config.action}
					onValueChange={(action) =>
						onChange({ ...config, action: action as ActionConfig['action'] })
					}
				>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="update_ticket">Update Ticket</SelectItem>
						<SelectItem value="assign_ticket">Assign Ticket</SelectItem>
						<SelectItem value="close_ticket">Close Ticket</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{config.action === 'update_ticket' && (
				<>
					<div>
						<Label>Field</Label>
						<Input
							value={config.field ?? ''}
							onChange={(e) => onChange({ ...config, field: e.target.value })}
							placeholder="Field to update"
						/>
					</div>
					<div>
						<Label>Value</Label>
						<Input
							value={config.value ?? ''}
							onChange={(e) => onChange({ ...config, value: e.target.value })}
							placeholder="New value"
						/>
					</div>
				</>
			)}
		</div>
	);
}

interface DelayConfigProps {
	config: DelayConfig;
	onChange: (config: DelayConfig) => void;
}

function DelayConfig({ config, onChange }: DelayConfigProps) {
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
				/>
			</div>

			<div>
				<Label>Unit</Label>
				<Select
					value={config.unit}
					onValueChange={(unit) =>
						onChange({ ...config, unit: unit as DelayConfig['unit'] })
					}
				>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="seconds">Seconds</SelectItem>
						<SelectItem value="minutes">Minutes</SelectItem>
						<SelectItem value="hours">Hours</SelectItem>
						<SelectItem value="days">Days</SelectItem>
					</SelectContent>
				</Select>
			</div>
		</div>
	);
}

interface NotificationConfigProps {
	config: NotificationConfig;
	onChange: (config: NotificationConfig) => void;
}

function NotificationConfig({ config, onChange }: NotificationConfigProps) {
	return (
		<div className="space-y-4">
			<div>
				<Label>Type</Label>
				<Select
					value={config.type}
					onValueChange={(type) =>
						onChange({ ...config, type: type as NotificationConfig['type'] })
					}
				>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="email">Email</SelectItem>
						<SelectItem value="in_app">In-App</SelectItem>
						<SelectItem value="webhook">Webhook</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div>
				<Label>Template</Label>
				<Input
					value={config.template}
					onChange={(e) => onChange({ ...config, template: e.target.value })}
					placeholder="Notification template"
				/>
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
				/>
			</div>
		</div>
	);
}
