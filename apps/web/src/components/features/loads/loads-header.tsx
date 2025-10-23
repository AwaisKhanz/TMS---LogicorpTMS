import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Upload, FileText, TrendingUp, Truck } from "lucide-react";
import { CanCreate } from "@/components/auth/can";

export function LoadsHeader() {
  return (
    <div className="space-y-6">
      {/* Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Load Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Track and manage your shipments and transportation orders
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="hidden sm:flex">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <CanCreate resource="load">
            <Button asChild className="bg-primary hover:bg-primary/90">
              <Link href="/loads/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Load
              </Link>
            </Button>
          </CanCreate>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Loads
                </p>
                <p className="text-2xl font-bold">-</p>
              </div>
              <FileText className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-success">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  In Transit
                </p>
                <p className="text-2xl font-bold">-</p>
              </div>
              <Truck className="h-8 w-8 text-success/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-warning">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Pending
                </p>
                <p className="text-2xl font-bold">-</p>
              </div>
              <TrendingUp className="h-8 w-8 text-warning/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-info">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  This Month
                </p>
                <p className="text-2xl font-bold">-</p>
              </div>
              <FileText className="h-8 w-8 text-info/60" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
