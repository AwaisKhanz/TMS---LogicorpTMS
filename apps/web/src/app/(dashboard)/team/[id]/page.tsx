"use client";

import { useParams } from "next/navigation";
import { UserDetailsPage } from "@/components/features/team/user-details-page";
import { PageHeader } from "@/components/common/page-header";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { PERMISSIONS } from "@tms/shared-types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function UserDetailsPageWrapper() {
  const params = useParams();
  const userId = params.id as string;

  return (
    <PermissionGuard
      permission={PERMISSIONS.USER_VIEW}
      fallback={
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/team">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Team
              </Link>
            </Button>
          </div>
          <PageHeader
            title="User Details"
            description="View detailed information about team members."
          />
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              You don&apos;t have permission to view user details. Please
              contact your administrator.
            </AlertDescription>
          </Alert>
        </div>
      }
    >
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/team">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Team
          </Link>
        </Button>
      </div>
      <PermissionGuard
        permission={PERMISSIONS.USER_VIEW}
        fallback={
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              You don&apos;t have permission to view this user&apos;s details.
              Please contact your administrator.
            </AlertDescription>
          </Alert>
        }
      >
        <UserDetailsPage userId={userId} />
      </PermissionGuard>
    </PermissionGuard>
  );
}
