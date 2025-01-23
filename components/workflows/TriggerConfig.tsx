import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import type { WorkflowTrigger, WorkflowTriggerType } from '@/lib/workflows/types';

interface TriggerConfigProps {
	trigger: WorkflowTrigger;
	onChange: (trigger: WorkflowTrigger) => void;
}

const TRIGGER_TYPES: { value: WorkflowTriggerType; label: string }[] = [
	{ value: 'ticket_created', label: 'Ticket Created' },
	{ value: 'ticket_updated', label: 'Ticket Updated' },
	{ value: 'ticket_status_changed', label: 'Status Changed' },
	{ value: 'ticket_priority_changed', label: 'Priority Changed' },
	{ value: 'ticket_assigned', label: 'Ticket Assigned' },
	{ value: 'ticket_commented', label: 'Comment Added' },
	{ value: 'scheduled', label: 'Scheduled' },
];

export function TriggerConfig({ trigger, onChange }: TriggerConfigProps) {
	return (
		<div className="space-y-6">
			<div>
				<Label>Trigger Type</Label>
				<Select
					value={trigger.type}
					onValueChange={(type) =>
						onChange({
							type: type as WorkflowTriggerType,
							conditions: getDefaultConditions(type as WorkflowTriggerType),
						})
					}
				>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{TRIGGER_TYPES.map((type) => (
							<SelectItem key={type.value} value={type.value}>
								{type.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{trigger.type === 'ticket_status_changed' && (
				<div className="space-y-4">
					<div>
						<Label>From Status</Label>
						<Select
							value={trigger.conditions?.fromStatus as string}
							onValueChange={(fromStatus) =>
								onChange({
									...trigger,
									conditions: {
										...trigger.conditions,
										fromStatus,
									},
								})
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="any">Any</SelectItem>
								<SelectItem value="open">Open</SelectItem>
								<SelectItem value="in_progress">In Progress</SelectItem>
								<SelectItem value="resolved">Resolved</SelectItem>
								<SelectItem value="closed">Closed</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div>
						<Label>To Status</Label>
						<Select
							value={trigger.conditions?.toStatus as string}
							onValueChange={(toStatus) =>
								onChange({
									...trigger,
									conditions: {
										...trigger.conditions,
										toStatus,
									},
								})
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="any">Any</SelectItem>
								<SelectItem value="open">Open</SelectItem>
								<SelectItem value="in_progress">In Progress</SelectItem>
								<SelectItem value="resolved">Resolved</SelectItem>
								<SelectItem value="closed">Closed</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
			)}

			{trigger.type === 'ticket_priority_changed' && (
				<div className="space-y-4">
					<div>
						<Label>From Priority</Label>
						<Select
							value={trigger.conditions?.fromPriority as string}
							onValueChange={(fromPriority) =>
								onChange({
									...trigger,
									conditions: {
										...trigger.conditions,
										fromPriority,
									},
								})
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="any">Any</SelectItem>
								<SelectItem value="low">Low</SelectItem>
								<SelectItem value="medium">Medium</SelectItem>
								<SelectItem value="high">High</SelectItem>
								<SelectItem value="urgent">Urgent</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div>
						<Label>To Priority</Label>
						<Select
							value={trigger.conditions?.toPriority as string}
							onValueChange={(toPriority) =>
								onChange({
									...trigger,
									conditions: {
										...trigger.conditions,
										toPriority,
									},
								})
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="any">Any</SelectItem>
								<SelectItem value="low">Low</SelectItem>
								<SelectItem value="medium">Medium</SelectItem>
								<SelectItem value="high">High</SelectItem>
								<SelectItem value="urgent">Urgent</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
			)}

			{trigger.type === 'scheduled' && (
				<div className="space-y-4">
					<div>
						<Label>Schedule Type</Label>
						<Select
							value={trigger.conditions?.scheduleType as string}
							onValueChange={(scheduleType) =>
								onChange({
									...trigger,
									conditions: {
										...trigger.conditions,
										scheduleType,
									},
								})
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="interval">Interval</SelectItem>
								<SelectItem value="cron">Cron</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{trigger.conditions?.scheduleType === 'interval' && (
						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label>Interval</Label>
								<Input
									type="number"
									value={trigger.conditions?.interval as number}
									onChange={(e) =>
										onChange({
											...trigger,
											conditions: {
												...trigger.conditions,
												interval: parseInt(e.target.value, 10),
											},
										})
									}
									min={1}
								/>
							</div>

							<div>
								<Label>Interval Type</Label>
								<Select
									value={trigger.conditions?.intervalType as string}
									onValueChange={(intervalType) =>
										onChange({
											...trigger,
											conditions: {
												...trigger.conditions,
												intervalType,
											},
										})
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="minutes">Minutes</SelectItem>
										<SelectItem value="hours">Hours</SelectItem>
										<SelectItem value="days">Days</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					)}

					{trigger.conditions?.scheduleType === 'cron' && (
						<div>
							<Label>Cron Expression</Label>
							<Input
								value={trigger.conditions?.cron as string}
								onChange={(e) =>
									onChange({
										...trigger,
										conditions: {
											...trigger.conditions,
											cron: e.target.value,
										},
									})
								}
								placeholder="* * * * *"
							/>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

function getDefaultConditions(type: WorkflowTriggerType): Record<string, unknown> {
	switch (type) {
		case 'ticket_status_changed':
			return {
				fromStatus: 'any',
				toStatus: 'any',
			};
		case 'ticket_priority_changed':
			return {
				fromPriority: 'any',
				toPriority: 'any',
			};
		case 'scheduled':
			return {
				scheduleType: 'interval',
				interval: 1,
				intervalType: 'hours',
			};
		default:
			return {};
	}
}
