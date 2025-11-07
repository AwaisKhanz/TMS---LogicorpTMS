"use client";

import { useParams, useRouter } from "next/navigation";
import { useConsignee, useDeleteConsignee } from "@/hooks/use-consignee";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Edit,
  Trash2,
  MapPin,
  Mail,
  Phone,
  Loader2,
  Building2,
  User,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CanDelete, CanEdit } from "@/components/auth/can";

export default function ConsigneeDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: consigneeData, isLoading, error } = useConsignee(id);
  const deleteConsignee = useDeleteConsignee();

  const consignee = consigneeData?.data;

  const handleDelete = async () => {
    try {
      await deleteConsignee.mutateAsync(id);
      toast.success("Consignee deleted successfully");
      router.push("/consignees");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete consignee";
      toast.error(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading consignee...</span>
        </div>
      </div>
    );
  }

  if (error || !consignee) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Consignee not found</h2>
          <p className="text-muted-foreground mb-4">
            The consignee you&apos;re looking for doesn&apos;t exist or has been
            deleted.
          </p>
          <Button asChild>
            <Link href="/consignees">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Consignees
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/consignees">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Consignees
            </Link>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <CanEdit resource="consignee">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/consignees/${id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
          </CanEdit>
          <CanDelete resource="consignee">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Consignee</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete &quot;
                    {consignee.companyName}
                    &quot;? This action cannot be undone and will remove all
                    associated data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CanDelete>
        </div>
      </div>

      {/* Consignee Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    {consignee.companyName}
                  </h3>
                  <Badge variant={consignee.isActive ? "default" : "secondary"}>
                    {consignee.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
              {consignee.contactPerson && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>{consignee.contactPerson}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{consignee.phone}</span>
              </div>
              {consignee.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{consignee.email}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div>{(consignee.address as any)?.street || ""}</div>
                <div>
                  {(consignee.address as any)?.city || ""}, {(consignee.address as any)?.state || ""} {(consignee.address as any)?.zip || ""}
                </div>
                <div>{(consignee.address as any)?.country || ""}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Notes */}
          {consignee.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {consignee.notes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Loads
                </span>
                <span className="font-medium">
                  {consignee._count?.loads || 0}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="font-medium">
                  {new Date(consignee.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Last Updated
                </span>
                <span className="font-medium">
                  {new Date(consignee.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
