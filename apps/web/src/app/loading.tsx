"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Truck } from "lucide-react";
import { useEffect, useState } from "react";

export default function Loading() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 0;
        return prev + 2;
      });
    }, 50);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Loading Card */}
        <Card className="border border-border">
          <CardContent className="pt-6">
            <div className="text-center space-y-6">
              {/* Animated Icon */}
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Truck className="h-8 w-8 text-primary animate-pulse" />
              </div>

              {/* Loading Text */}
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">
                  Loading...
                </h2>
                <p className="text-sm text-muted-foreground">
                  Please wait while we prepare your dashboard
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <Progress value={progress} className="w-full h-2" />
                <p className="text-xs text-muted-foreground">
                  {Math.round(progress)}% Complete
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
