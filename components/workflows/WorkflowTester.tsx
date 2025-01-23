import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Play, StepForward, RotateCcw, Mail, Bell, Globe } from 'lucide-react';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import type { Workflow, WorkflowTriggerType, NotificationStep } from '@/lib/workflows/types';
import { testTrigger, testStep, getNextSteps } from '@/lib/workflows/testing';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { evaluateCondition } from '@/lib/workflows/handlers';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TEST_DATA_TEMPLATES: Record<WorkflowTriggerType, Record<string, any>> = {
	ticket_created: {
		id: 'new-ticket-123',
		title: 'Example Support Request',
		description: 'Customer needs help with login',
		status: 'open',
		priority: 'medium',
		assignedTo: null,
		createdBy: 'customer-456',
		createdAt: new Date().toISOString(),
	},
	ticket_updated: {
		id: 'ticket-123',
		title: 'Updated Support Request',
		description: 'Updated description with more details',
		status: 'open',
		priority: 'high',
		assignedTo: 'agent-789',
		updatedBy: 'agent-789',
		updatedAt: new Date().toISOString(),
		previousValues: {
			title: 'Original Support Request',
			description: 'Original description',
			priority: 'medium',
		},
	},
	ticket_status_changed: {
		id: 'ticket-123',
		title: 'Status Change Example',
		currentStatus: 'in_progress',
		previousStatus: 'open',
		changedBy: 'agent-789',
		changedAt: new Date().toISOString(),
	},
	ticket_priority_changed: {
		id: 'ticket-123',
		title: 'Priority Change Example',
		currentPriority: 'high',
		previousPriority: 'medium',
		changedBy: 'agent-789',
		changedAt: new Date().toISOString(),
	},
	ticket_assigned: {
		id: 'ticket-123',
		title: 'Assignment Example',
		status: 'open',
		priority: 'high',
		assignedTo: 'agent-789',
		previousAssignee: null,
		assignedBy: 'supervisor-123',
		assignedAt: new Date().toISOString(),
	},
	ticket_commented: {
		id: 'ticket-123',
		title: 'Comment Example',
		comment: {
			id: 'comment-456',
			content: 'This is a test comment',
			author: 'agent-789',
			createdAt: new Date().toISOString(),
		},
	},
	scheduled: {
		currentTime: new Date().toISOString(),
		lastExecutionTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 hours ago
	},
};

const CONDITION_TEST_TEMPLATES = {
	ticket_status: {
		label: 'Ticket Status',
		data: {
			status: 'open',
			previousStatus: 'new',
			priority: 'high',
			assignedTo: 'agent-123',
			title: 'Test Ticket',
			description: 'Test description',
			tags: ['bug', 'urgent'],
			customFields: {
				severity: 'critical',
				category: 'technical',
			},
		},
	},
	ticket_priority: {
		label: 'Ticket Priority',
		data: {
			status: 'in_progress',
			priority: 'high',
			previousPriority: 'medium',
			sla: {
				breached: false,
				dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
			},
			metrics: {
				responseTime: 3600,
				updateCount: 5,
			},
		},
	},
	ticket_assignment: {
		label: 'Ticket Assignment',
		data: {
			status: 'open',
			priority: 'medium',
			assignedTo: 'agent-456',
			previousAssignee: 'agent-123',
			team: 'support-team-1',
			skills: ['networking', 'security'],
			workload: {
				activeTickets: 5,
				totalTickets: 20,
			},
		},
	},
	ticket_metadata: {
		label: 'Ticket Metadata',
		data: {
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			source: 'email',
			channel: 'support',
			customer: {
				id: 'cust-789',
				tier: 'premium',
				region: 'europe',
			},
			metadata: {
				browser: 'Chrome',
				os: 'Windows',
				version: '1.2.3',
			},
		},
	},
};

const NOTIFICATION_TEST_DATA = {
	ticket: {
		id: 'ticket-123',
		title: 'Important Support Request',
		status: 'open',
		priority: 'high',
		description: 'Customer is experiencing login issues',
		assignedTo: 'agent-789',
		customer: {
			name: 'John Doe',
			email: 'john@example.com',
			company: 'Acme Corp',
		},
		metadata: {
			source: 'email',
			category: 'technical',
			tags: ['urgent', 'login'],
		},
	},
	agent: {
		id: 'agent-789',
		name: 'Jane Smith',
		email: 'jane@company.com',
		role: 'Support Agent',
		team: 'Technical Support',
	},
	workflow: {
		name: 'High Priority Ticket Handler',
		trigger: 'ticket_priority_changed',
		step: 'Send Notification',
	},
};

interface WorkflowTesterProps {
	workflow: Workflow;
}

export function WorkflowTester({ workflow }: WorkflowTesterProps) {
	const [testData, setTestData] = useState('{}');
	const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const [executionResults, setExecutionResults] = useState<Record<string, any>>({});
	const [error, setError] = useState<string | null>(null);
	const [nextStepIds, setNextStepIds] = useState<string[]>([]);
	const [conditionTestData, setConditionTestData] = useState('{}');
	const [conditionResults, setConditionResults] = useState<Record<string, boolean>>({});
	const [notificationPreviewData, setNotificationPreviewData] = useState(
		JSON.stringify(NOTIFICATION_TEST_DATA, null, 2)
	);

	const handleReset = () => {
		setTestData('{}');
		setCurrentStepIndex(-1);
		setExecutionResults({});
		setError(null);
		setNextStepIds([]);
	};

	const handleTemplateSelect = (templateType: WorkflowTriggerType) => {
		setTestData(JSON.stringify(TEST_DATA_TEMPLATES[templateType], null, 2));
	};

	const handleRunTest = async () => {
		try {
			setError(null);
			const data = JSON.parse(testData);

			// Test trigger
			const triggerResult = await testTrigger(workflow.trigger, data);
			if (!triggerResult) {
				setError('Trigger conditions not met');
				return;
			}

			setExecutionResults({
				trigger: { success: true },
			});

			// Get initial steps
			const initialSteps = await getNextSteps(workflow, 0);
			setNextStepIds(initialSteps);
			setCurrentStepIndex(0);
		} catch {
			setError('Invalid JSON data');
		}
	};

	const handleStepForward = async () => {
		try {
			if (currentStepIndex === -1 || currentStepIndex >= workflow.steps.length) {
				return;
			}

			const data = JSON.parse(testData);
			const context = {
				data,
				results: executionResults,
			};

			if (nextStepIds.length === 0) {
				setError('Workflow execution complete');
				return;
			}

			// Execute next step
			const nextStepId = nextStepIds[0];
			const step = workflow.steps.find((s) => s.id === nextStepId);
			if (!step) {
				setError(`Step ${nextStepId} not found`);
				return;
			}

			const result = await testStep(step, context);
			setExecutionResults({
				...executionResults,
				[step.id]: result,
			});

			// Update next steps
			const remainingSteps = nextStepIds.slice(1);
			const newNextSteps = result.success ? result.nextSteps : [];
			setNextStepIds([...remainingSteps, ...newNextSteps]);

			setCurrentStepIndex(currentStepIndex + 1);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Unknown error occurred');
		}
	};

	const getCurrentStep = () => {
		if (currentStepIndex === 0) {
			return {
				type: 'trigger',
				data: workflow.trigger,
			};
		}

		const stepId = nextStepIds[0];
		const step = workflow.steps.find((s) => s.id === stepId);
		return {
			type: 'step',
			data: step,
		};
	};

	const handleTestConditions = async () => {
		try {
			const data = JSON.parse(conditionTestData);
			const results: Record<string, boolean> = {};

			// Test each condition step
			for (const step of workflow.steps) {
				if (step.type === 'condition') {
					const result = await evaluateCondition(step.config, data);
					results[step.id] = result;
				}
			}

			setConditionResults(results);
			setError(null);
		} catch {
			setError('Invalid JSON data for condition testing');
		}
	};

	const handleConditionTemplateSelect = (templateKey: keyof typeof CONDITION_TEST_TEMPLATES) => {
		setConditionTestData(JSON.stringify(CONDITION_TEST_TEMPLATES[templateKey].data, null, 2));
	};

	const renderNotificationPreview = (step: NotificationStep) => {
		try {
			const data = JSON.parse(notificationPreviewData);
			/* eslint-disable @typescript-eslint/no-explicit-any */
			const renderedTemplate = step.config.template.replace(
				/\${([^}]+)}/g,
				(match: string, path: string) => {
					const value = path
						.split('.')
						.reduce((obj: any, key: string) => obj?.[key], data);
					return value ?? match;
				}
			);
			/* eslint-enable @typescript-eslint/no-explicit-any */

			switch (step.config.type) {
				case 'email':
					return (
						<div className="space-y-4 border rounded-lg p-4">
							<div className="flex items-center gap-2">
								<Mail className="w-4 h-4" />
								<h4 className="font-medium">Email Preview</h4>
							</div>
							<div className="space-y-2 text-sm">
								<div>
									<span className="text-muted-foreground">To: </span>
									{step.config.recipients.join(', ')}
								</div>
								<div>
									<span className="text-muted-foreground">Subject: </span>
									{renderedTemplate.split('\n')[0]}
								</div>
								<div className="whitespace-pre-wrap border rounded p-3 bg-muted/50">
									{renderedTemplate.split('\n').slice(1).join('\n')}
								</div>
							</div>
						</div>
					);

				case 'in_app':
					return (
						<div className="space-y-4 border rounded-lg p-4">
							<div className="flex items-center gap-2">
								<Bell className="w-4 h-4" />
								<h4 className="font-medium">In-App Notification Preview</h4>
							</div>
							<div className="flex items-start gap-3 p-3 bg-muted/50 rounded">
								<Bell className="w-5 h-5 mt-0.5 text-primary" />
								<div className="space-y-1 text-sm">
									<div className="font-medium">
										{renderedTemplate.split('\n')[0]}
									</div>
									<div className="text-muted-foreground">
										{renderedTemplate.split('\n').slice(1).join('\n')}
									</div>
								</div>
							</div>
						</div>
					);

				case 'webhook':
					return (
						<div className="space-y-4 border rounded-lg p-4">
							<div className="flex items-center gap-2">
								<Globe className="w-4 h-4" />
								<h4 className="font-medium">Webhook Preview</h4>
							</div>
							<div className="space-y-2 text-sm">
								<div>
									<span className="text-muted-foreground">URL: </span>
									{step.config.recipients[0]}
								</div>
								<div>
									<span className="text-muted-foreground">Payload:</span>
									<pre className="mt-1 p-3 bg-muted/50 rounded overflow-auto">
										{JSON.stringify(
											{
												template: renderedTemplate,
												data,
											},
											null,
											2
										)}
									</pre>
								</div>
							</div>
						</div>
					);
			}
		} catch (error) {
			return (
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>
						Error previewing notification:{' '}
						{error instanceof Error ? error.message : 'Invalid data'}
					</AlertDescription>
				</Alert>
			);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Test Workflow: {workflow.name}</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				<Tabs defaultValue="workflow">
					<TabsList>
						<TabsTrigger value="workflow">Workflow Execution</TabsTrigger>
						<TabsTrigger value="conditions">Test Conditions</TabsTrigger>
						<TabsTrigger value="notifications">Preview Notifications</TabsTrigger>
					</TabsList>

					<TabsContent value="workflow">
						<div className="space-y-6">
							<div className="space-y-2">
								<div className="flex justify-between items-center">
									<Label>Test Data (JSON)</Label>
									<Select onValueChange={handleTemplateSelect}>
										<SelectTrigger className="w-[200px]">
											<SelectValue placeholder="Load template..." />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="ticket_created">
												Ticket Created
											</SelectItem>
											<SelectItem value="ticket_updated">
												Ticket Updated
											</SelectItem>
											<SelectItem value="ticket_status_changed">
												Status Changed
											</SelectItem>
											<SelectItem value="ticket_priority_changed">
												Priority Changed
											</SelectItem>
											<SelectItem value="ticket_assigned">
												Ticket Assigned
											</SelectItem>
											<SelectItem value="ticket_commented">
												Comment Added
											</SelectItem>
											<SelectItem value="scheduled">Scheduled</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<Textarea
									value={testData}
									onChange={(e) => setTestData(e.target.value)}
									placeholder="Enter test data in JSON format"
									className="font-mono"
									rows={10}
								/>
							</div>

							{error && (
								<Alert variant="destructive">
									<AlertCircle className="h-4 w-4" />
									<AlertDescription>{error}</AlertDescription>
								</Alert>
							)}

							<div className="flex gap-2">
								<Button onClick={handleRunTest}>
									<Play className="w-4 h-4 mr-2" />
									Run Test
								</Button>
								<Button
									variant="outline"
									onClick={handleStepForward}
									disabled={currentStepIndex === -1 || nextStepIds.length === 0}
								>
									<StepForward className="w-4 h-4 mr-2" />
									Step Forward
								</Button>
								<Button
									variant="ghost"
									onClick={handleReset}
									disabled={
										currentStepIndex === -1 && testData === '{}' && !error
									}
								>
									<RotateCcw className="w-4 h-4 mr-2" />
									Reset
								</Button>
							</div>

							{currentStepIndex >= 0 && (
								<div className="space-y-4">
									<div>
										<Label>Current Step</Label>
										<div className="p-4 rounded-lg border mt-2">
											{(() => {
												const current = getCurrentStep();
												/* eslint-disable @typescript-eslint/no-explicit-any */
												return (
													<div>
														<h4 className="font-medium">
															{current.type === 'trigger'
																? 'Trigger'
																: `Step ${(current.data as any).id}`}
														</h4>
														<pre className="mt-2 text-sm">
															{JSON.stringify(current.data, null, 2)}
														</pre>
													</div>
												);
												/* eslint-enable @typescript-eslint/no-explicit-any */
											})()}
										</div>
									</div>

									<div>
										<Label>Next Steps</Label>
										<div className="p-4 rounded-lg border mt-2">
											<pre className="text-sm">
												{JSON.stringify(nextStepIds, null, 2)}
											</pre>
										</div>
									</div>

									<div>
										<Label>Execution Results</Label>
										<pre className="p-4 rounded-lg border mt-2 text-sm">
											{JSON.stringify(executionResults, null, 2)}
										</pre>
									</div>
								</div>
							)}
						</div>
					</TabsContent>

					<TabsContent value="conditions" className="space-y-6">
						<div className="space-y-2">
							<div className="flex justify-between items-center">
								<Label>Test Data (JSON)</Label>
								<Select onValueChange={handleConditionTemplateSelect}>
									<SelectTrigger className="w-[200px]">
										<SelectValue placeholder="Load template..." />
									</SelectTrigger>
									<SelectContent>
										{Object.entries(CONDITION_TEST_TEMPLATES).map(
											([key, template]) => (
												<SelectItem key={key} value={key}>
													{template.label}
												</SelectItem>
											)
										)}
									</SelectContent>
								</Select>
							</div>
							<Textarea
								value={conditionTestData}
								onChange={(e) => setConditionTestData(e.target.value)}
								placeholder="Enter test data to evaluate conditions"
								className="font-mono"
								rows={6}
							/>
						</div>

						<div className="flex gap-2">
							<Button onClick={handleTestConditions}>
								<Play className="w-4 h-4 mr-2" />
								Test Conditions
							</Button>
							<Button
								variant="ghost"
								onClick={() => {
									setConditionTestData('{}');
									setConditionResults({});
								}}
								disabled={
									conditionTestData === '{}' &&
									Object.keys(conditionResults).length === 0
								}
							>
								<RotateCcw className="w-4 h-4 mr-2" />
								Reset
							</Button>
						</div>

						<div className="space-y-4">
							{workflow.steps
								.filter((step) => step.type === 'condition')
								.map((step) => (
									<div key={step.id} className="p-4 rounded-lg border">
										<h4 className="font-medium mb-2">Condition: {step.id}</h4>
										<div className="space-y-2">
											<div className="text-sm text-muted-foreground">
												{step.config.field} {step.config.operator}{' '}
												{step.config.value}
											</div>
											{conditionResults[step.id] !== undefined && (
												<div
													className={`text-sm ${conditionResults[step.id] ? 'text-green-600' : 'text-red-600'}`}
												>
													Result:{' '}
													{conditionResults[step.id] ? 'True' : 'False'}
												</div>
											)}
										</div>
									</div>
								))}
						</div>
					</TabsContent>

					<TabsContent value="notifications" className="space-y-6">
						<div className="space-y-2">
							<Label>Test Data (JSON)</Label>
							<Textarea
								value={notificationPreviewData}
								onChange={(e) => setNotificationPreviewData(e.target.value)}
								placeholder="Enter test data for notification templates"
								className="font-mono"
								rows={6}
							/>
						</div>

						<div className="space-y-4">
							{workflow.steps
								.filter(
									(step): step is NotificationStep => step.type === 'notification'
								)
								.map((step) => (
									<div key={step.id} className="space-y-2">
										<h4 className="font-medium">Step: {step.id}</h4>
										{renderNotificationPreview(step)}
									</div>
								))}
						</div>
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
}
