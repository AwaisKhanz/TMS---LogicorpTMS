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
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, FileText, DollarSign, Truck, Clock } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadDetailsPageProps {
  params: {
    id: string;
  };
}

export default function LoadDetailsPage({ params }: LoadDetailsPageProps) {
  const [activeTab, setActiveTab] = useState("overview");

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
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="financials" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Financials</span>
          </TabsTrigger>
          <TabsTrigger value="assignment" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            <span className="hidden sm:inline">Assignment</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Documents</span>
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Timeline</span>
          </TabsTrigger>
        </TabsList>

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
