import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="max-w-md w-full gradient-card border-border/50">
            <CardContent className="p-8 text-center space-y-4">
              <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                <AlertTriangle className="h-7 w-7 text-destructive" />
              </div>
              <h2 className="text-xl font-semibold">Something went wrong</h2>
              <p className="text-muted-foreground text-sm">
                An unexpected error occurred. Please try again or reload the page.
              </p>
              {import.meta.env.DEV && this.state.error && (
                <pre className="text-xs text-left bg-muted/50 rounded-lg p-3 overflow-auto max-h-32 text-muted-foreground">
                  {this.state.error.message}
                </pre>
              )}
              <div className="flex gap-3 justify-center pt-2">
                <Button variant="outline" onClick={this.handleRetry}>
                  Try Again
                </Button>
                <Button onClick={this.handleReload}>
                  <RefreshCw className="h-4 w-4 mr-1.5" />
                  Reload Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
