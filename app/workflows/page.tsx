'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@/lib/supabase/client';
import type { Workflow, WorkflowTrigger, WorkflowStep } from '@/lib/workflows/types';

export default function WorkflowsPage() {
	const [workflows, setWorkflows] = useState<Workflow[]>([]);
	const [loading, setLoading] = useState(false);
	const router = useRouter();
	const { toast } = useToast();

	const loadWorkflows = async () => {
		setLoading(true);
		try {
			const supabase = createClient();
			const { data, error } = await supabase.from('workflows').select('*');
			if (error) {
				throw error;
			}
			if (data) {
				// Map the data to ensure required fields are present
				const mappedWorkflows = data.map((workflow) => {
					// First assert the JSON fields to unknown, then to their specific types
					const trigger = workflow.trigger as unknown as WorkflowTrigger;
					const steps = workflow.steps as unknown as WorkflowStep[];

					return {
						id: workflow.id,
						name: workflow.name,
						description: workflow.description || '',
						trigger,
						steps,
						isActive: workflow.is_active,
						createdAt: workflow.created_at || new Date().toISOString(),
						updatedAt: workflow.updated_at || new Date().toISOString(),
					};
				});
				setWorkflows(mappedWorkflows);
			}
		} catch (error) {
			console.error('Error loading workflows:', error);
			toast({
				title: 'Error',
				description: 'Failed to load workflows. Please try again.',
				variant: 'destructive',
			});
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadWorkflows();
	});

	const toggleWorkflow = async (id: string, isActive: boolean) => {
		try {
			const { error } = await createClient()
				.from('workflows')
				.update({ is_active: !isActive })
				.eq('id', id);

			if (error) {
				throw error;
			}

			setWorkflows((prev) =>
				prev.map((w) => (w.id === id ? { ...w, isActive: !isActive } : w))
			);

			toast({
				title: 'Success',
				description: `Workflow ${isActive ? 'disabled' : 'enabled'} successfully`,
			});
		} catch {
			toast({
				title: 'Error',
				description: 'Failed to update workflow',
				variant: 'destructive',
			});
		}
	};

	const deleteWorkflow = async (id: string) => {
		try {
			const { error } = await createClient().from('workflows').delete().eq('id', id);

			if (error) {
				throw error;
			}

			setWorkflows((prev) => prev.filter((w) => w.id !== id));

			toast({
				title: 'Success',
				description: 'Workflow deleted successfully',
			});
		} catch {
			toast({
				title: 'Error',
				description: 'Failed to delete workflow',
				variant: 'destructive',
			});
		}
	};

	return (
		<div className="container mx-auto py-8">
			<div className="flex justify-between items-center mb-8">
				<h1 className="text-3xl font-bold">Workflows</h1>
				<Button onClick={() => router.push('/workflows/new')}>
					<Plus className="w-4 h-4 mr-2" />
					New Workflow
				</Button>
			</div>

			<div className="grid gap-6">
				{workflows.map((workflow) => (
					<Card key={workflow.id}>
						<CardHeader>
							<CardTitle className="flex justify-between items-center">
								<span>{workflow.name}</span>
								<div className="space-x-2">
									<Button
										variant="outline"
										onClick={() => router.push(`/workflows/${workflow.id}`)}
									>
										Edit
									</Button>
									<Button
										variant="outline"
										onClick={() =>
											toggleWorkflow(workflow.id, workflow.isActive)
										}
									>
										{workflow.isActive ? 'Disable' : 'Enable'}
									</Button>
									<Button
										variant="destructive"
										onClick={() => deleteWorkflow(workflow.id)}
									>
										Delete
									</Button>
								</div>
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-muted-foreground">{workflow.description}</p>
							<div className="mt-4 flex items-center space-x-4 text-sm">
								<div>
									Trigger:{' '}
									<span className="font-medium">{workflow.trigger.type}</span>
								</div>
								<div>
									Steps:{' '}
									<span className="font-medium">{workflow.steps.length}</span>
								</div>
								<div>
									Status:{' '}
									<span
										className={`font-medium ${
											workflow.isActive ? 'text-green-600' : 'text-red-600'
										}`}
									>
										{workflow.isActive ? 'Active' : 'Inactive'}
									</span>
								</div>
							</div>
						</CardContent>
					</Card>
				))}

				{!loading && workflows.length === 0 && (
					<Card>
						<CardContent className="py-8">
							<div className="text-center text-muted-foreground">
								<p>No workflows found</p>
								<Button
									variant="link"
									onClick={() => router.push('/workflows/new')}
								>
									Create your first workflow
								</Button>
							</div>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
}
