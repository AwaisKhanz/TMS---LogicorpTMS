"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ThemeShowcase() {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Color Palette</CardTitle>
          <CardDescription>All available theme colors</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Primary Colors */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Primary</h3>
            <div className="flex gap-2">
              <div className="h-20 w-20 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-xs text-primary-foreground">Primary</span>
              </div>
              <div className="h-20 w-20 rounded-lg bg-primary/80 flex items-center justify-center">
                <span className="text-xs text-primary-foreground">80%</span>
              </div>
              <div className="h-20 w-20 rounded-lg bg-primary/60 flex items-center justify-center">
                <span className="text-xs text-primary-foreground">60%</span>
              </div>
              <div className="h-20 w-20 rounded-lg bg-primary/40 flex items-center justify-center">
                <span className="text-xs text-foreground">40%</span>
              </div>
              <div className="h-20 w-20 rounded-lg bg-primary/20 flex items-center justify-center">
                <span className="text-xs text-foreground">20%</span>
              </div>
            </div>
          </div>

          {/* Success Colors */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Success</h3>
            <div className="flex gap-2">
              <div className="h-20 w-20 rounded-lg bg-success flex items-center justify-center">
                <span className="text-xs text-success-foreground">Success</span>
              </div>
              <div className="h-20 w-20 rounded-lg bg-success/80 flex items-center justify-center">
                <span className="text-xs text-success-foreground">80%</span>
              </div>
              <div className="h-20 w-20 rounded-lg bg-success/60 flex items-center justify-center">
                <span className="text-xs text-success-foreground">60%</span>
              </div>
              <div className="h-20 w-20 rounded-lg bg-success/40 flex items-center justify-center">
                <span className="text-xs text-foreground">40%</span>
              </div>
              <div className="h-20 w-20 rounded-lg bg-success/20 flex items-center justify-center">
                <span className="text-xs text-foreground">20%</span>
              </div>
            </div>
          </div>

          {/* Warning Colors */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Warning</h3>
            <div className="flex gap-2">
              <div className="h-20 w-20 rounded-lg bg-warning flex items-center justify-center">
                <span className="text-xs text-warning-foreground">Warning</span>
              </div>
              <div className="h-20 w-20 rounded-lg bg-warning/80 flex items-center justify-center">
                <span className="text-xs text-warning-foreground">80%</span>
              </div>
              <div className="h-20 w-20 rounded-lg bg-warning/60 flex items-center justify-center">
                <span className="text-xs text-warning-foreground">60%</span>
              </div>
              <div className="h-20 w-20 rounded-lg bg-warning/40 flex items-center justify-center">
                <span className="text-xs text-foreground">40%</span>
              </div>
              <div className="h-20 w-20 rounded-lg bg-warning/20 flex items-center justify-center">
                <span className="text-xs text-foreground">20%</span>
              </div>
            </div>
          </div>

          {/* Destructive Colors */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Destructive</h3>
            <div className="flex gap-2">
              <div className="h-20 w-20 rounded-lg bg-destructive flex items-center justify-center">
                <span className="text-xs text-destructive-foreground">
                  Error
                </span>
              </div>
              <div className="h-20 w-20 rounded-lg bg-destructive/80 flex items-center justify-center">
                <span className="text-xs text-destructive-foreground">80%</span>
              </div>
              <div className="h-20 w-20 rounded-lg bg-destructive/60 flex items-center justify-center">
                <span className="text-xs text-destructive-foreground">60%</span>
              </div>
              <div className="h-20 w-20 rounded-lg bg-destructive/40 flex items-center justify-center">
                <span className="text-xs text-foreground">40%</span>
              </div>
              <div className="h-20 w-20 rounded-lg bg-destructive/20 flex items-center justify-center">
                <span className="text-xs text-foreground">20%</span>
              </div>
            </div>
          </div>

          {/* Chart Colors */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Chart Colors</h3>
            <div className="flex gap-2">
              <div className="h-20 w-20 rounded-lg bg-chart-1 flex items-center justify-center">
                <span className="text-xs text-white">Chart 1</span>
              </div>
              <div className="h-20 w-20 rounded-lg bg-chart-2 flex items-center justify-center">
                <span className="text-xs text-white">Chart 2</span>
              </div>
              <div className="h-20 w-20 rounded-lg bg-chart-3 flex items-center justify-center">
                <span className="text-xs text-white">Chart 3</span>
              </div>
              <div className="h-20 w-20 rounded-lg bg-chart-4 flex items-center justify-center">
                <span className="text-xs text-white">Chart 4</span>
              </div>
              <div className="h-20 w-20 rounded-lg bg-chart-5 flex items-center justify-center">
                <span className="text-xs text-white">Chart 5</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Button Variants</CardTitle>
          <CardDescription>All available button styles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button>Primary Button</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
          </div>
          <div className="flex flex-wrap gap-4 mt-4">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Badge Variants</CardTitle>
          <CardDescription>All available badge styles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="info">Info</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
