"use client";

import { useParams, useRouter } from "next/navigation";
import { useShipper, useDeleteShipper } from "@/hooks/use-shipper";
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
import { CanEdit, CanDelete } from "@/components/auth/can";

export default function ShipperDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: shipperData, isLoading, error } = useShipper(id);
  const deleteShipper = useDeleteShipper();

  const shipper = shipperData?.data;

  const handleDelete = async () => {
    try {
      await deleteShipper.mutateAsync(id);
      toast.success("Shipper deleted successfully");
      router.push("/shippers");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete shipper";
      toast.error(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading shipper...</span>
        </div>
      </div>
    );
  }

  if (error || !shipper) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Shipper not found</h2>
          <p className="text-muted-foreground mb-4">
            The shipper you&apos;re looking for doesn&apos;t exist or has been
            deleted.
          </p>
          <Button asChild>
            <Link href="/shippers">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Shippers
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
            <Link href="/shippers">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Shippers
            </Link>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <CanEdit resource="shipper">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/shippers/${id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
          </CanEdit>
          <CanDelete resource="shipper">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Shipper</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete &quot;{shipper.companyName}
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

      {/* Shipper Overview */}
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
                    {shipper.companyName}
                  </h3>
                  <Badge variant={shipper.isActive ? "default" : "secondary"}>
                    {shipper.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
              {shipper.contactPerson && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>{shipper.contactPerson}</span>
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
                <span>{shipper.phone}</span>
              </div>
              {shipper.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{shipper.email}</span>
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
                <div>{(shipper.address as any)?.street || ""}</div>
                <div>
                  {(shipper.address as any)?.city || ""}, {(shipper.address as any)?.state || ""} {(shipper.address as any)?.zip || ""}
                </div>
                <div>{(shipper.address as any)?.country || ""}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Notes */}
          {shipper.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {shipper.notes}
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
                  {shipper._count?.loads || 0}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="font-medium">
                  {new Date(shipper.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Last Updated
                </span>
                <span className="font-medium">
                  {new Date(shipper.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
