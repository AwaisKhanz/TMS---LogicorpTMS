"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModernStatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: "increase" | "decrease" | "neutral";
  icon?: React.ReactNode;
  description?: string;
  className?: string;
}

export function ModernStatsCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon,
  description,
  className,
}: ModernStatsCardProps) {
  const getChangeIcon = () => {
    switch (changeType) {
      case "increase":
        return <TrendingUp className="h-3 w-3" />;
      case "decrease":
        return <TrendingDown className="h-3 w-3" />;
      default:
        return <Minus className="h-3 w-3" />;
    }
  };

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          {icon && (
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              {icon}
            </div>
          )}
        </div>

        {change !== undefined && (
          <div className="mt-4 flex items-center gap-1">
            <Badge
              variant="outline"
              className={cn(
                "text-xs font-medium",
                changeType === "increase" &&
                  "bg-success/10 text-success border-success/20",
                changeType === "decrease" &&
                  "bg-destructive/10 text-destructive border-destructive/20",
                changeType === "neutral" &&
                  "bg-muted/10 text-muted-foreground border-muted/20"
              )}
            >
              {getChangeIcon()}
              <span className="ml-1">{Math.abs(change)}%</span>
            </Badge>
            <span className="text-xs text-muted-foreground">vs last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
