import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TriggerConfig } from './TriggerConfig';
import { StepEditor } from './StepEditor';
import { WorkflowSettings } from './WorkflowSettings';
import type { Workflow, WorkflowTrigger, WorkflowStep } from '@/lib/workflows/types';
import { useWorkflowValidation } from '@/lib/hooks/useWorkflowValidation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { WorkflowProvider } from '@/lib/contexts/workflow';

interface WorkflowBuilderProps {
	workflow?: Workflow;
	onSave: (workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

export function WorkflowBuilder({ workflow, onSave }: WorkflowBuilderProps) {
	const [trigger, setTrigger] = useState<WorkflowTrigger>(
		workflow?.trigger || {
			type: 'ticket_created',
			conditions: {},
		}
	);
	const [steps, setSteps] = useState<WorkflowStep[]>(workflow?.steps || []);
	const [name, setName] = useState(workflow?.name || '');
	const [description, setDescription] = useState(workflow?.description || '');
	const [isActive, setIsActive] = useState(workflow?.isActive ?? true);

	const { isValid, validationState } = useWorkflowValidation(name, description, trigger, steps);

	const handleSave = async () => {
		if (!isValid) {
			return;
		}

		await onSave({
			name,
			description,
			trigger,
			steps,
			isActive,
		});
	};

	const handleSettingsChange = (settings: {
		name: string;
		description: string;
		isActive: boolean;
	}) => {
		setName(settings.name);
		setDescription(settings.description);
		setIsActive(settings.isActive);
	};

	return (
		<WorkflowProvider triggerType={trigger.type}>
			<div className="space-y-4">
				{!isValid && validationState.global.errors.length > 0 && (
					<Alert variant="destructive">
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>
							{validationState.global.errors.map((error, index) => (
								<div key={index}>{error.message}</div>
							))}
						</AlertDescription>
					</Alert>
				)}

				<Card>
					<CardHeader>
						<CardTitle>Workflow Builder</CardTitle>
					</CardHeader>
					<CardContent>
						<Tabs defaultValue="trigger">
							<TabsList className="grid w-full grid-cols-3">
								<TabsTrigger value="trigger">Trigger</TabsTrigger>
								<TabsTrigger value="steps">Steps</TabsTrigger>
								<TabsTrigger value="settings">Settings</TabsTrigger>
							</TabsList>
							<TabsContent value="trigger">
								<TriggerConfig
									trigger={trigger}
									onChange={setTrigger}
									validationErrors={validationState.trigger.errors}
								/>
							</TabsContent>
							<TabsContent value="steps">
								<StepEditor
									steps={steps}
									onChange={setSteps}
									validationErrors={[
										...Object.entries(validationState.steps).flatMap(
											([stepId, result]) =>
												result.errors.map((error) => ({
													...error,
													field: `${stepId}.${error.field}`,
												}))
										),
										...validationState.global.errors.filter((error) =>
											error.field.startsWith('step_')
										),
									]}
								/>
							</TabsContent>
							<TabsContent value="settings">
								<WorkflowSettings
									name={name}
									description={description}
									isActive={isActive}
									onChange={handleSettingsChange}
									onSave={handleSave}
									validationErrors={validationState.settings.errors}
								/>
							</TabsContent>
						</Tabs>
					</CardContent>
				</Card>
			</div>
		</WorkflowProvider>
	);
}
