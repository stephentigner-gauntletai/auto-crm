import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TriggerConfig } from './TriggerConfig';
import { StepEditor } from './StepEditor';
import { WorkflowSettings } from './WorkflowSettings';
import type { Workflow, WorkflowTrigger, WorkflowStep } from '@/lib/workflows/types';

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

	const handleSave = async () => {
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
		<div className="space-y-4">
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
							<TriggerConfig trigger={trigger} onChange={setTrigger} />
						</TabsContent>
						<TabsContent value="steps">
							<StepEditor steps={steps} onChange={setSteps} />
						</TabsContent>
						<TabsContent value="settings">
							<WorkflowSettings
								name={name}
								description={description}
								isActive={isActive}
								onChange={handleSettingsChange}
								onSave={handleSave}
							/>
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>
		</div>
	);
}
