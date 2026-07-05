import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorState } from './ErrorState';

interface SectionErrorBoundaryProps {
  children: ReactNode;
  fallbackMessage?: string;
}

interface SectionErrorBoundaryState {
  hasError: boolean;
}

export class SectionErrorBoundary extends Component<
  SectionErrorBoundaryProps,
  SectionErrorBoundaryState
> {
  state: SectionErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): SectionErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('SectionErrorBoundary caught an error', error, info);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <ErrorState message={this.props.fallbackMessage ?? 'This section failed to load.'} />
      );
    }
    return this.props.children;
  }
}
