import React from 'react';

interface Props { children: React.ReactNode }

export class ErrorBoundary extends React.Component<Props, { error: Error | null }> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: any) {
    // You can add reporting here
    // eslint-disable-next-line no-console
    console.error('Unhandled error in UI:', error, info);
  }

  render() {
    if (this.state.error) {
      const isSupabaseError = this.state.error.message.includes('Missing Supabase configuration');
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="max-w-xl p-6 bg-card border rounded">
            <h2 className="text-xl font-bold mb-2">
              {isSupabaseError ? 'Configuration Required' : 'Something went wrong'}
            </h2>
            <p className="text-muted-foreground mb-4">
              {isSupabaseError 
                ? 'PartyHaus requires Supabase configuration to function properly.'
                : 'An unexpected error occurred. Please try again or report this issue.'
              }
            </p>
            {isSupabaseError && (
              <div className="mb-4 p-4 bg-secondary rounded">
                <h3 className="font-semibold mb-2">Setup Instructions:</h3>
                <ol className="text-sm space-y-1 list-decimal list-inside">
                  <li>Create a Supabase project at <a href="https://supabase.com" className="text-primary underline" target="_blank" rel="noopener noreferrer">supabase.com</a></li>
                  <li>Copy your project URL and anon key from the project dashboard</li>
                  <li>Update the values in your <code className="bg-background px-1 rounded">.env</code> file</li>
                  <li>Restart the development server</li>
                </ol>
              </div>
            )}
            <details className="whitespace-pre-wrap text-sm text-muted-foreground max-h-48 overflow-auto">
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
