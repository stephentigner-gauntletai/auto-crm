'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkflowSettings } from '@/components/workflows/WorkflowSettings';
import { TriggerConfig } from '@/components/workflows/TriggerConfig';
import { StepEditor } from '@/components/workflows/StepEditor';
import { FlowDiagram } from '@/components/workflows/FlowDiagram';
import type { WorkflowStep, WorkflowTrigger } from '@/lib/workflows/types';
import type { Database } from '@/types/supabase';

type WorkflowInsert = Database['public']['Tables']['workflows']['Insert'];

export default function NewWorkflowPage() {
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [isActive, setIsActive] = useState(true);
	const [trigger, setTrigger] = useState<WorkflowTrigger>({
		type: 'ticket_created',
		conditions: {},
	});
	const [steps, setSteps] = useState<WorkflowStep[]>([]);
	const [saving, setSaving] = useState(false);

	const router = useRouter();
	const { toast } = useToast();
	const supabase = createClient();

	const handleSave = async () => {
		try {
			if (!name.trim()) {
				toast({
					title: 'Error',
					description: 'Please enter a workflow name',
					variant: 'destructive',
				});
				return;
			}

			if (!steps.length) {
				toast({
					title: 'Error',
					description: 'Please add at least one step',
					variant: 'destructive',
				});
				return;
			}

			setSaving(true);

			// Convert to database types
			const workflowData: WorkflowInsert = {
				name,
				description,
				trigger:
					trigger as unknown as Database['public']['Tables']['workflows']['Row']['trigger'],
				steps: steps as unknown as Database['public']['Tables']['workflows']['Row']['steps'],
				is_active: isActive,
			};

			const { error } = await supabase.from('workflows').insert(workflowData);

			if (error) {
				throw error;
			}

			toast({
				title: 'Success',
				description: 'Workflow created successfully',
			});

			router.push('/workflows');
		} catch (error) {
			console.error('Error creating workflow:', error);
			toast({
				title: 'Error',
				description: 'Failed to create workflow',
				variant: 'destructive',
			});
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="container mx-auto py-8">
			<div className="flex justify-between items-center mb-8">
				<h1 className="text-3xl font-bold">New Workflow</h1>
				<div className="space-x-2">
					<Button variant="outline" onClick={() => router.push('/workflows')}>
						Cancel
					</Button>
					<Button onClick={handleSave} disabled={saving}>
						{saving ? 'Creating...' : 'Create Workflow'}
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-6">
				<Card>
					<CardContent className="p-6">
						<Tabs defaultValue="settings">
							<TabsList className="mb-4">
								<TabsTrigger value="settings">Settings</TabsTrigger>
								<TabsTrigger value="trigger">Trigger</TabsTrigger>
								<TabsTrigger value="steps">Steps</TabsTrigger>
							</TabsList>

							<TabsContent value="settings">
								<WorkflowSettings
									name={name}
									description={description}
									isActive={isActive}
									onChange={({ name, description, isActive }) => {
										setName(name);
										setDescription(description);
										setIsActive(isActive);
									}}
								/>
							</TabsContent>

							<TabsContent value="trigger">
								<TriggerConfig trigger={trigger} onChange={setTrigger} />
							</TabsContent>

							<TabsContent value="steps">
								<StepEditor steps={steps} onChange={setSteps} />
							</TabsContent>
						</Tabs>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<FlowDiagram steps={steps} />
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
