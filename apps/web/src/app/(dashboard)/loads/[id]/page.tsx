import { Suspense } from "react";
import { LoadOverview } from "@/components/features/loads/load-overview";
import { LoadTimeline } from "@/components/features/loads/load-timeline";
import { LoadDocuments } from "@/components/features/loads/load-documents";
import { LoadFinancials } from "@/components/features/loads/load-financials";
import { LoadStatusWorkflow } from "@/components/features/loads/load-status-workflow";
import { LoadActions } from "@/components/features/loads/load-actions";
import { LoadAssignment } from "@/components/features/loads/load-assignment";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadDetailsPageProps {
  params: {
    id: string;
  };
}

export default function LoadDetailsPage({ params }: LoadDetailsPageProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/loads">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Loads
            </Link>
          </Button>
        </div>
        <LoadActions loadId={params.id} />
      </div>

      {/* Load Overview */}
      <Suspense fallback={<Skeleton className="h-32 w-full" />}>
        <LoadOverview loadId={params.id} />
      </Suspense>

      {/* Status Workflow */}
      <Suspense fallback={<Skeleton className="h-24 w-full" />}>
        <LoadStatusWorkflow loadId={params.id} />
      </Suspense>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <LoadFinancials loadId={params.id} />
          </Suspense>

          <Suspense fallback={<Skeleton className="h-48 w-full" />}>
            <LoadAssignment loadId={params.id} />
          </Suspense>

          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <LoadTimeline loadId={params.id} />
          </Suspense>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <LoadDocuments loadId={params.id} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
