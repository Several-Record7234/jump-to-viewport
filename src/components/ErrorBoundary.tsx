import { Component, ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
    state: State = { error: null };

    static getDerivedStateFromError(error: Error): State {
        return { error };
    }

    componentDidCatch(error: Error) {
        console.error('[Views] Uncaught error:', error);
    }

    render() {
        if (this.state.error) {
            return (
                <div style={{ padding: '0.75rem', color: 'var(--color-red)', fontSize: '0.8rem' }}>
                    <strong>Something went wrong.</strong>
                    <br />
                    Try closing and reopening the extension.
                    <br />
                    <span style={{ color: 'var(--color-overlay1)', fontFamily: 'monospace' }}>
                        {this.state.error.message}
                    </span>
                </div>
            );
        }
        return this.props.children;
    }
}
