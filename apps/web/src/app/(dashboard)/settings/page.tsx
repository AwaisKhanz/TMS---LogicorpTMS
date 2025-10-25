"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TwoFactorSettings } from "@/components/features/two-factor";
import { ProfileSettings } from "@/components/features/settings/profile-settings";
import { OrganizationSettings } from "@/components/features/settings/organization-settings";
import { SecuritySettings } from "@/components/features/settings/security-settings";
import { User, Shield, Building } from "lucide-react";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { PERMISSIONS } from "@tms/shared-types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock } from "lucide-react";

export default function SettingsPage() {
  return (
    <PermissionGuard
      permission={PERMISSIONS.SETTINGS_VIEW}
      fallback={
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-muted-foreground">
                Manage your account and organization settings
              </p>
            </div>
          </div>
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              You don't have permission to view settings. Please contact your
              administrator.
            </AlertDescription>
          </Alert>
        </div>
      }
    >
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="organization" className="gap-2">
            <Building className="h-4 w-4" />
            <span className="hidden sm:inline">Organization</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <ProfileSettings />
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <TwoFactorSettings />
          <SecuritySettings />
        </TabsContent>

        <TabsContent value="organization" className="space-y-4">
          <OrganizationSettings />
        </TabsContent>
      </Tabs>
    </PermissionGuard>
  );
}
