"use client";

import { Suspense, useState } from "react";
import { LoadOverview } from "@/components/features/loads/load-overview";
import { LoadTimeline } from "@/components/features/loads/load-timeline";
import { LoadDocuments } from "@/components/features/loads/load-documents";
import { LoadFinancials } from "@/components/features/loads/load-financials";
import { LoadStatusWorkflow } from "@/components/features/loads/load-status-workflow";
import { LoadActions } from "@/components/features/loads/load-actions";
import { LoadAssignment } from "@/components/features/loads/load-assignment";
import { LoadSummary } from "@/components/features/loads/load-summary";
import { LoadActivity } from "@/components/features/loads/load-activity";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  FileText,
  DollarSign,
  Truck,
  Clock,
  AlertTriangle,
  Home,
} from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoad } from "@/hooks/use-loads";

interface LoadDetailsPageProps {
  params: {
    id: string;
  };
}

export default function LoadDetailsPage({ params }: LoadDetailsPageProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const { data: load, isLoading, error } = useLoad(params.id);

  // Handle loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col gap-4">
            <div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/loads">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Loads
                </Link>
              </Button>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Load Details
              </h1>
              <p className="text-muted-foreground">
                Loading load information...
              </p>
            </div>
          </div>
        </div>
        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-12">
          <div className="lg:col-span-8 space-y-4 sm:space-y-6">
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="lg:col-span-4 space-y-4 sm:space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Handle error state (404 or other errors)
  if (error || !load) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col gap-4">
            <div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/loads">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Loads
                </Link>
              </Button>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Load Not Found
              </h1>
              <p className="text-muted-foreground">
                The load you&apos;re looking for doesn&apos;t exist or has been
                removed
              </p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Load Not Found
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                The load with ID &quot;{params.id}&quot; could not be found.
                This could be because:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>The load ID is incorrect</li>
                  <li>The load has been deleted</li>
                  <li>You don&apos;t have permission to view this load</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild>
                <Link href="/loads">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Loads
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">
                  <Home className="h-4 w-4 mr-2" />
                  Go to Dashboard
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Modern Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col gap-4">
          <div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/loads">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Loads
              </Link>
            </Button>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Load Details</h1>
            <p className="text-muted-foreground">
              Manage and track your shipment
            </p>
          </div>
        </div>
        <LoadActions loadId={params.id} />
      </div>

      {/* Tabbed Interface */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <div className="w-full overflow-x-auto">
          <TabsList className="inline-flex md:w-full md:flex min-w-full md:min-w-0">
            <TabsTrigger
              value="overview"
              className="flex-shrink-0 md:flex-1 whitespace-nowrap flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger
              value="financials"
              className="flex-shrink-0 md:flex-1 whitespace-nowrap flex items-center gap-2"
            >
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Financials</span>
            </TabsTrigger>
            <TabsTrigger
              value="assignment"
              className="flex-shrink-0 md:flex-1 whitespace-nowrap flex items-center gap-2"
            >
              <Truck className="h-4 w-4" />
              <span className="hidden sm:inline">Assignment</span>
            </TabsTrigger>
            <TabsTrigger
              value="documents"
              className="flex-shrink-0 md:flex-1 whitespace-nowrap flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Documents</span>
            </TabsTrigger>
            <TabsTrigger
              value="timeline"
              className="flex-shrink-0 md:flex-1 whitespace-nowrap flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Timeline</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-6">
          {/* Mobile-first responsive grid */}
          <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-12">
            {/* Main Content Area - Full width on mobile, 8/12 on desktop */}
            <div className="lg:col-span-8 space-y-4 sm:space-y-6">
              {/* Load Overview - Full width */}
              <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                <LoadOverview loadId={params.id} />
              </Suspense>
            </div>

            {/* Sidebar - Full width on mobile, 4/12 on desktop */}
            <div className="lg:col-span-4 space-y-4 sm:space-y-6 flex flex-col h-full">
              {/* Status Workflow - Compact */}
              <Suspense fallback={<Skeleton className="h-32 w-full" />}>
                <LoadStatusWorkflow loadId={params.id} compact />
              </Suspense>

              {/* Quick Actions Card - Compact on the right */}
              <Card className="flex-1">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3">Quick Actions</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setActiveTab("documents")}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Add Document
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setActiveTab("assignment")}
                    >
                      <Truck className="h-4 w-4 mr-2" />
                      Assign Carrier
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setActiveTab("financials")}
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      Update Rates
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="col-span-full space-y-4 sm:space-y-6">
              {/* Load Summary - Full width */}
              <Suspense fallback={<Skeleton className="h-32 w-full" />}>
                <LoadSummary loadId={params.id} />
              </Suspense>

              {/* Recent Activity - More space on the left */}
              <Suspense fallback={<Skeleton className="h-32 w-full" />}>
                <LoadActivity loadId={params.id} />
              </Suspense>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="financials" className="space-y-6">
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <LoadFinancials loadId={params.id} />
          </Suspense>
        </TabsContent>

        <TabsContent value="assignment" className="space-y-6">
          <Suspense fallback={<Skeleton className="h-48 w-full" />}>
            <LoadAssignment loadId={params.id} />
          </Suspense>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <LoadDocuments loadId={params.id} />
          </Suspense>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <LoadTimeline loadId={params.id} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
