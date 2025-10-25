"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useUserDetails } from "@/hooks/use-user-details";
import { useTeamMembers } from "@/hooks/use-settings";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { PERMISSIONS } from "@tms/shared-types";
import {
  MoreHorizontal,
  Mail,
  Phone,
  Calendar,
  Shield,
  Users,
  Building2,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Eye,
  Activity,
  DollarSign,
} from "lucide-react";
import { EditTeamMemberDialog } from "./edit-team-member-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRemoveTeamMember } from "@/hooks/use-settings";
import { toast } from "sonner";

interface UserDetailsPageProps {
  userId: string;
}

export function UserDetailsPage({ userId }: UserDetailsPageProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: user, isLoading, error } = useUserDetails(userId);
  const { data: teamMembers } = useTeamMembers();
  const removeTeamMember = useRemoveTeamMember();

  // Find the team member data for additional info
  const teamMember = teamMembers?.find((member) => member.id === userId);

  const handleDelete = async () => {
    try {
      await removeTeamMember.mutateAsync(userId);
      toast.success("Team member removed successfully!");
      setIsDeleteDialogOpen(false);
    } catch (error) {
      toast.error("Failed to remove team member");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load user details: {error?.message || "Unknown error"}
        </AlertDescription>
      </Alert>
    );
  }

  if (!user) {
    return (
      <Alert>
        <XCircle className="h-4 w-4" />
        <AlertDescription>User not found.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage
              src={user.avatar || ""}
              alt={`${user.firstName} ${user.lastName}`}
            />
            <AvatarFallback className="text-lg">
              {user.firstName[0]}
              {user.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-muted-foreground">{user.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={user.isActive ? "default" : "secondary"}>
                {user.isActive ? "Active" : "Inactive"}
              </Badge>
              {user.twoFactorEnabled && (
                <Badge
                  variant="outline"
                  className="text-green-600 border-green-600"
                >
                  <Shield className="h-3 w-3 mr-1" />
                  2FA Enabled
                </Badge>
              )}
              {user.emailVerified && (
                <Badge
                  variant="outline"
                  className="text-blue-600 border-blue-600"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Email Verified
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PermissionGuard permission={PERMISSIONS.USER_EDIT}>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </PermissionGuard>
          <PermissionGuard permission={PERMISSIONS.USER_EDIT} fallback={null}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <PermissionGuard permission={PERMISSIONS.USER_VIEW}>
                  <DropdownMenuItem>
                    <Eye className="h-4 w-4 mr-2" />
                    View Activity
                  </DropdownMenuItem>
                </PermissionGuard>
                <PermissionGuard permission={PERMISSIONS.USER_EDIT}>
                  <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Member
                  </DropdownMenuItem>
                </PermissionGuard>
                <PermissionGuard permission={PERMISSIONS.USER_DELETE}>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Member
                  </DropdownMenuItem>
                </PermissionGuard>
              </DropdownMenuContent>
            </DropdownMenu>
          </PermissionGuard>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Basic information about the team member
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  First Name
                </label>
                <p className="text-sm">{user.firstName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Last Name
                </label>
                <p className="text-sm">{user.lastName}</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Email
              </label>
              <p className="text-sm flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {user.email}
              </p>
            </div>
            {user.phone && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Phone
                </label>
                <p className="text-sm flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {user.phone}
                </p>
              </div>
            )}
            <Separator />
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Status
              </label>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={user.isActive ? "default" : "secondary"}>
                  {user.isActive ? "Active" : "Inactive"}
                </Badge>
                {user.twoFactorEnabled && (
                  <Badge
                    variant="outline"
                    className="text-green-600 border-green-600"
                  >
                    <Shield className="h-3 w-3 mr-1" />
                    2FA
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Account Information
            </CardTitle>
            <CardDescription>
              Account status and activity information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Email Verification
              </label>
              <div className="flex items-center gap-2 mt-1">
                {user.emailVerified ? (
                  <Badge
                    variant="outline"
                    className="text-green-600 border-green-600"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-red-600 border-red-600"
                  >
                    <XCircle className="h-3 w-3 mr-1" />
                    Not Verified
                  </Badge>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Two-Factor Authentication
              </label>
              <div className="flex items-center gap-2 mt-1">
                {user.twoFactorEnabled ? (
                  <Badge
                    variant="outline"
                    className="text-green-600 border-green-600"
                  >
                    <Shield className="h-3 w-3 mr-1" />
                    Enabled
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-gray-600 border-gray-600"
                  >
                    <XCircle className="h-3 w-3 mr-1" />
                    Disabled
                  </Badge>
                )}
              </div>
            </div>
            {user.lastLogin && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Last Login
                </label>
                <p className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {format(new Date(user.lastLogin), "MMM dd, yyyy 'at' h:mm a")}
                </p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Member Since
              </label>
              <p className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {format(new Date(user.createdAt), "MMM dd, yyyy")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Roles and Permissions */}
      {teamMember?.roles && teamMember.roles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Roles & Permissions
            </CardTitle>
            <CardDescription>
              Current roles and permissions assigned to this team member
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {teamMember.roles.map((role) => (
                <Badge key={role} variant="secondary" className="text-sm">
                  {role}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assigned Customers */}
      {teamMember?.assignedCustomers &&
        teamMember.assignedCustomers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Assigned Customers
              </CardTitle>
              <CardDescription>
                Customers assigned to this team member
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {teamMember.assignedCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{customer.companyName}</p>
                        <p className="text-sm text-muted-foreground">
                          {customer.billingEmail}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        <DollarSign className="h-3 w-3 inline mr-1" />$
                        {customer.creditLimit.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Credit Limit
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      {/* Edit Dialog */}
      <PermissionGuard permission={PERMISSIONS.USER_EDIT}>
        <EditTeamMemberDialog
          member={teamMember || null}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
        />
      </PermissionGuard>

      {/* Delete Confirmation Dialog */}
      <PermissionGuard permission={PERMISSIONS.USER_DELETE}>
        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove {user.firstName} {user.lastName}{" "}
                from the team? This action cannot be undone and they will lose
                access to the organization.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={removeTeamMember.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {removeTeamMember.isPending ? "Removing..." : "Remove Member"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PermissionGuard>
    </div>
  );
}
