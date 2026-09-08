import React from 'react';

interface Props { children: React.ReactNode }

/**
 * Last-resort boundary for render-time exceptions.
 *
 * This component used to branch on a vendor-specific configuration message
 * and, when it matched, render four setup steps and an outbound link. Nothing
 * in the product throws that message, so the branch was permanently false: it
 * shipped an unreachable link to a third party inside every production bundle.
 * It is gone rather than rewritten, because the generic message was already
 * the only one that could ever render.
 */
export class ErrorBoundary extends React.Component<Props, { error: Error | null }> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('Unhandled error in UI:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="max-w-xl w-full p-6 bg-card border rounded-lg">
            <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4">
              An unexpected error occurred. Reloading usually clears it. If it keeps
              happening, the message below is the useful part of a bug report.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mb-4 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Reload the page
            </button>
            <details className="whitespace-pre-wrap text-sm text-muted-foreground max-h-48 overflow-auto">
              <summary className="cursor-pointer font-medium">Error detail</summary>
              {this.state.error?.message}
            </details>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
