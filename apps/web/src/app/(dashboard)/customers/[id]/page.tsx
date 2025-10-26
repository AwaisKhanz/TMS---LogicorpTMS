"use client";

import { useParams, useRouter } from "next/navigation";
import { useCustomer, useDeleteCustomer } from "@/hooks/use-customer";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Edit,
  Trash2,
  MapPin,
  Mail,
  Phone,
  Loader2,
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

export default function CustomerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: customer, isLoading, error } = useCustomer(id);
  console.log(customer);
  const deleteCustomer = useDeleteCustomer();

  const handleDelete = async () => {
    try {
      await deleteCustomer.mutateAsync(id);
      toast.success("Customer deleted successfully");
      router.push("/customers");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete customer";
      toast.error(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading customer.customer...</span>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-lg text-muted-foreground">Customer not found</p>
        <Button asChild>
          <Link href="/customers">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Customers
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex w-full gap-4">
        <div className="flex flex-col w-full gap-4">
          <div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/customers">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  {customer.data.companyName}
                </h1>
                <Badge
                  variant={customer.data.isActive ? "default" : "secondary"}
                >
                  {customer.data.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              {customer.data.dba && (
                <p className="text-muted-foreground mt-1">
                  DBA: {customer.data.dba}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <CanEdit resource="customer">
                <Button asChild>
                  <Link href={`/customers/${id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </Button>
              </CanEdit>
              <CanDelete resource="customer">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete the customer and all associated data.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        variant="destructive"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CanDelete>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Company Name</p>
              <p className="font-medium">{customer.data.companyName}</p>
            </div>
            {customer.data.dba && (
              <div>
                <p className="text-sm text-muted-foreground">DBA</p>
                <p className="font-medium">{customer.data.dba}</p>
              </div>
            )}
            {customer.data.industry && (
              <div>
                <p className="text-sm text-muted-foreground">Industry</p>
                <p className="font-medium">{customer.data.industry}</p>
              </div>
            )}
            {customer.data.website && (
              <div>
                <p className="text-sm text-muted-foreground">Website</p>
                <a
                  href={customer.data.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {customer.data.website}
                </a>
              </div>
            )}
            {customer.data.ein && (
              <div>
                <p className="text-sm text-muted-foreground">EIN</p>
                <p className="font-medium">{customer.data.ein}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Billing Address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Billing Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium">
                {customer.data.billingAddress.street}
              </p>
              <p className="text-sm text-muted-foreground">
                {customer.data.billingAddress.city},{" "}
                {customer.data.billingAddress.state}{" "}
                {customer.data.billingAddress.zip}
              </p>
              {customer.data.billingAddress.country && (
                <p className="text-sm text-muted-foreground">
                  {customer.data.billingAddress.country}
                </p>
              )}
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`mailto:${customer.data.billingEmail}`}
                  className="text-primary hover:underline"
                >
                  {customer.data.billingEmail}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`tel:${customer.data.billingPhone}`}
                  className="text-primary hover:underline"
                >
                  {customer.data.billingPhone}
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Information */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Credit Limit</p>
                <p className="text-2xl font-bold">
                  ${customer.data.creditLimit?.toLocaleString() || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payment Terms</p>
                <p className="font-medium">{customer.data.paymentTerms}</p>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-success">
                  ${customer.data.totalRevenue?.toLocaleString() || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Loads</p>
                <p className="text-2xl font-bold">
                  {customer.data.totalLoads || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Equipment Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Equipment Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            {customer.data.equipmentTypes &&
            customer.data.equipmentTypes.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {customer.data.equipmentTypes.map((equipment) => (
                  <Badge key={equipment} variant="secondary">
                    {equipment.replace(/_/g, " ")}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No equipment preferences set
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {customer.data.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{customer.data.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Created At</p>
            <p className="font-medium">
              {new Date(customer.data.createdAt).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Last Updated</p>
            <p className="font-medium">
              {new Date(customer.data.updatedAt).toLocaleString()}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
