"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, RefreshCw, Home, Bug, ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  const handleTryAgain = () => {
    reset();
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Main Error Card */}
        <Card className="border-2 border-destructive/20">
          <CardContent className="pt-6">
            <div className="text-center space-y-6">
              {/* Icon */}
              <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>

              {/* Heading */}
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold text-foreground">
                  Something went wrong
                </h1>
                <p className="text-muted-foreground">
                  We encountered an unexpected error. This has been logged and
                  our team will investigate.
                </p>
              </div>

              {/* Error Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-destructive/10 border border-destructive/20 rounded-full">
                <Bug className="w-3 h-3 text-destructive" />
                <span className="text-sm text-destructive font-medium">
                  Application Error
                </span>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <Button onClick={handleTryAgain} className="w-full" size="lg">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>

                <div className="grid grid-cols-2 gap-3">
                  <Button onClick={handleReload} variant="outline" size="lg">
                    Reload Page
                  </Button>

                  <Link href="/">
                    <Button variant="outline" className="w-full" size="lg">
                      <Home className="mr-2 h-4 w-4" />
                      Home
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Details (Collapsible) */}
        <Card>
          <CardContent className="pt-4">
            <Collapsible open={showDetails} onOpenChange={setShowDetails}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between"
                >
                  <span className="text-sm text-muted-foreground">
                    Error Details
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform ${showDetails ? "rotate-180" : ""}`}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-3">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <div className="space-y-2">
                      <p className="font-medium">Error Message:</p>
                      <p className="font-mono text-xs break-all bg-destructive/5 p-2 rounded border">
                        {error.message || "Unknown error occurred"}
                      </p>
                      {error.digest && (
                        <>
                          <p className="font-medium">Error ID:</p>
                          <p className="font-mono text-xs break-all bg-destructive/5 p-2 rounded border">
                            {error.digest}
                          </p>
                        </>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>

        {/* Support Information */}
        <Card className="border border-info/20 bg-info/5">
          <CardContent className="pt-4">
            <div className="space-y-3">
              <h3 className="font-medium text-info-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-info" />
                Need Help?
              </h3>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  If this error persists, please contact our support team with
                  the error details above.
                </p>
                <p className="text-xs">
                  We&apos;re working to resolve any issues as quickly as
                  possible.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* App Info */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            LogicorpTMS - Transportation Management System
          </p>
        </div>
      </div>
    </div>
  );
}
