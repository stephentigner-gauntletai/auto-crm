'use client';

import { useEffect, useState, useCallback } from 'react';
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
import { WorkflowTester } from '@/components/workflows/WorkflowTester';
import type { WorkflowStep, WorkflowTrigger } from '@/lib/workflows/types';

interface EditWorkflowPageProps {
	params: {
		id: string;
	};
}

export default function EditWorkflowPage({ params }: EditWorkflowPageProps) {
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [isActive, setIsActive] = useState(true);
	const [trigger, setTrigger] = useState<WorkflowTrigger>({
		type: 'ticket_created',
		conditions: {},
	});
	const [steps, setSteps] = useState<WorkflowStep[]>([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	const router = useRouter();
	const { toast } = useToast();

	const loadWorkflow = useCallback(async () => {
		const supabase = createClient();
		try {
			setLoading(true);
			const { data: dbWorkflow, error: loadError } = await supabase
				.from('workflows')
				.select('*')
				.eq('id', params.id)
				.single();

			if (loadError) {
				toast({
					title: 'Error loading workflow',
					description: loadError.message,
					variant: 'destructive',
				});
				return;
			}

			if (!dbWorkflow) {
				toast({
					title: 'Error loading workflow',
					description: 'Workflow not found',
					variant: 'destructive',
				});
				return;
			}

			setName(dbWorkflow.name);
			setDescription(dbWorkflow.description || '');
			setIsActive(dbWorkflow.is_active);
			setTrigger(dbWorkflow.trigger as unknown as WorkflowTrigger);
			setSteps(dbWorkflow.steps as unknown as WorkflowStep[]);
		} catch (err) {
			toast({
				title: 'Error loading workflow',
				description: err instanceof Error ? err.message : 'An error occurred',
				variant: 'destructive',
			});
		} finally {
			setLoading(false);
		}
	}, [params.id, toast]);

	useEffect(() => {
		loadWorkflow();
	}, [loadWorkflow]);

	const handleSave = async () => {
		const supabase = createClient();
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

			// Convert workflow format to database format
			const workflowData = {
				name,
				description,
				trigger: JSON.parse(JSON.stringify(trigger)),
				steps: JSON.parse(JSON.stringify(steps)),
				is_active: isActive,
			};

			const { error } = await supabase
				.from('workflows')
				.update(workflowData)
				.eq('id', params.id);

			if (error) {
				throw error;
			}

			toast({
				title: 'Success',
				description: 'Workflow updated successfully',
			});

			router.push('/workflows');
		} catch (error) {
			toast({
				title: 'Error',
				description: 'Failed to update workflow',
				variant: 'destructive',
			});
			console.error('Error updating workflow:', error);
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<div className="container mx-auto py-8">
				<div className="flex justify-between items-center mb-8">
					<h1 className="text-3xl font-bold">Edit Workflow</h1>
				</div>
				<Card>
					<CardContent className="p-6">
						<div className="h-96 flex items-center justify-center">
							<div className="text-muted-foreground">Loading workflow...</div>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="container mx-auto py-8">
			<div className="flex justify-between items-center mb-8">
				<h1 className="text-3xl font-bold">Edit Workflow</h1>
				<div className="space-x-2">
					<Button variant="outline" onClick={() => router.push('/workflows')}>
						Cancel
					</Button>
					<Button onClick={handleSave} disabled={saving}>
						{saving ? 'Saving...' : 'Save Changes'}
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
								<TabsTrigger value="test">Test</TabsTrigger>
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

							<TabsContent value="test">
								<WorkflowTester
									workflow={{
										id: params.id,
										name,
										description,
										trigger,
										steps,
										isActive,
										createdAt: '', // These fields aren't needed for testing
										updatedAt: '',
									}}
								/>
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
