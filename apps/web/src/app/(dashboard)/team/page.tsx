"use client";

import { TeamManagement } from "@/components/features/team/team-management";
import { PageHeader } from "@/components/common/page-header";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { PERMISSIONS } from "@tms/shared-types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock } from "lucide-react";

export default function TeamPage() {
  return (
    <PermissionGuard
      permission={PERMISSIONS.USER_VIEW}
      fallback={
        <div className="space-y-6">
          <PageHeader
            title="Team Management"
            description="Manage your organization's team members, roles, and permissions."
          />
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              You don't have permission to view team members. Please contact
              your administrator.
            </AlertDescription>
          </Alert>
        </div>
      }
    >
      <PageHeader
        title="Team Management"
        description="Manage your organization's team members, roles, and permissions."
      />
      <TeamManagement />
    </PermissionGuard>
  );
}
