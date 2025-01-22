import * as React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface ErrorBoundaryProps {
	children: React.ReactNode;
	fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		// Log the error to your error reporting service
		console.error('Error caught by boundary:', error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}

			return (
				<div className="flex flex-col items-center justify-center p-4 space-y-4 text-center">
					<AlertCircle className="w-12 h-12 text-destructive" />
					<div className="space-y-2">
						<h3 className="text-lg font-semibold">Something went wrong</h3>
						<p className="text-sm text-muted-foreground">
							{this.state.error?.message || 'An unexpected error occurred'}
						</p>
					</div>
					<Button
						variant="outline"
						onClick={() => this.setState({ hasError: false, error: null })}
					>
						Try again
					</Button>
				</div>
			);
		}

		return this.props.children;
	}
}
