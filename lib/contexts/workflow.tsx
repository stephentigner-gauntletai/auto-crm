import { createContext, useContext } from 'react';
import type { WorkflowTriggerType } from '@/lib/workflows/types';

interface WorkflowContextType {
	triggerType: WorkflowTriggerType;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

export function useWorkflow() {
	const context = useContext(WorkflowContext);
	if (!context) {
		throw new Error('useWorkflow must be used within a WorkflowProvider');
	}
	return context;
}

interface WorkflowProviderProps {
	triggerType: WorkflowTriggerType;
	children: React.ReactNode;
}

export function WorkflowProvider({ triggerType, children }: WorkflowProviderProps) {
	return <WorkflowContext.Provider value={{ triggerType }}>{children}</WorkflowContext.Provider>;
}
