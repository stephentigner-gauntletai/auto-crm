'use client';

import { useCallback } from 'react';
import ReactFlow, {
	Node,
	Edge,
	Background,
	Controls,
	MiniMap,
	useNodesState,
	useEdgesState,
	NodeMouseHandler,
} from 'reactflow';
import 'reactflow/dist/style.css';
import type {
	WorkflowStep,
	ConditionStep,
	ActionStep,
	DelayStep,
	NotificationStep,
} from '@/lib/workflows/types';

interface FlowDiagramProps {
	steps: WorkflowStep[];
	onStepSelect?: (stepId: string) => void;
}

const nodeTypes = {
	condition: ConditionNode,
	action: ActionNode,
	delay: DelayNode,
	notification: NotificationNode,
};

export function FlowDiagram({ steps, onStepSelect }: FlowDiagramProps) {
	const [nodes, setNodes, onNodesChange] = useNodesState([]);
	const [edges, setEdges, onEdgesChange] = useEdgesState([]);

	const onInit = useCallback(() => {
		const flowNodes: Node[] = steps.map((step, index) => ({
			id: step.id,
			type: step.type,
			position: calculateNodePosition(index, steps.length),
			data: { step },
		}));

		const flowEdges: Edge[] = steps.flatMap((step) =>
			step.nextSteps.map((nextStepId) => ({
				id: `${step.id}-${nextStepId}`,
				source: step.id,
				target: nextStepId,
				animated: true,
			}))
		);

		setNodes(flowNodes);
		setEdges(flowEdges);
	}, [steps, setNodes, setEdges]);

	const handleNodeClick: NodeMouseHandler = (_, node) => {
		onStepSelect?.(node.id);
	};

	return (
		<div className="h-[600px] border rounded-md">
			<ReactFlow
				nodes={nodes}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onInit={onInit}
				nodeTypes={nodeTypes}
				onNodeClick={handleNodeClick}
				fitView
			>
				<Background />
				<Controls />
				<MiniMap />
			</ReactFlow>
		</div>
	);
}

function calculateNodePosition(index: number, total: number) {
	const radius = Math.min(total * 50, 300);
	const angle = (index / total) * 2 * Math.PI;
	return {
		x: radius * Math.cos(angle) + radius,
		y: radius * Math.sin(angle) + radius,
	};
}

interface NodeProps {
	data: {
		step: WorkflowStep;
	};
}

function ConditionNode({ data }: NodeProps) {
	const step = data.step as ConditionStep;
	return (
		<div className="px-4 py-2 rounded-md bg-yellow-100 border border-yellow-300">
			<div className="font-medium">Condition</div>
			<div className="text-sm text-muted-foreground">
				{step.config.field} {step.config.operator} {step.config.value}
			</div>
		</div>
	);
}

function ActionNode({ data }: NodeProps) {
	const step = data.step as ActionStep;
	return (
		<div className="px-4 py-2 rounded-md bg-blue-100 border border-blue-300">
			<div className="font-medium">Action</div>
			<div className="text-sm text-muted-foreground">{step.config.action}</div>
		</div>
	);
}

function DelayNode({ data }: NodeProps) {
	const step = data.step as DelayStep;
	return (
		<div className="px-4 py-2 rounded-md bg-purple-100 border border-purple-300">
			<div className="font-medium">Delay</div>
			<div className="text-sm text-muted-foreground">
				{step.config.duration} {step.config.unit}
			</div>
		</div>
	);
}

function NotificationNode({ data }: NodeProps) {
	const step = data.step as NotificationStep;
	return (
		<div className="px-4 py-2 rounded-md bg-green-100 border border-green-300">
			<div className="font-medium">Notification</div>
			<div className="text-sm text-muted-foreground">{step.config.type}</div>
		</div>
	);
}
