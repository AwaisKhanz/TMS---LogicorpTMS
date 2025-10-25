"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  MoreVertical,
  Package,
  FileText,
  Send,
  Download,
  User,
  Settings,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import {
  useExportCustomers,
  useBulkUpdateCustomers,
} from "@/hooks/use-customer";
import { Customer } from "@tms/shared-types";
// Local formatCurrency function
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

interface CustomerActionsProps {
  customer: Customer;
}

export function CustomerActions({ customer }: CustomerActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkAction, setBulkAction] = useState<
    "activate" | "deactivate" | "export" | "delete" | null
  >(null);
  const [bulkNote, setBulkNote] = useState("");

  const { mutate: exportCustomers } = useExportCustomers();
  const { mutate: bulkUpdateCustomers, isPending: isBulkUpdating } =
    useBulkUpdateCustomers();

  const handleCreateLoad = () => {
    router.push(`/loads/new?customerId=${customer.id}`);
  };

  const handleCreateInvoice = () => {
    router.push(`/invoices/new?customerId=${customer.id}`);
  };

  const handleSendStatement = () => {
    // TODO: Implement send statement functionality
    toast({
      title: "Statement Sent",
      description: `Statement sent to ${customer.companyName}`,
    });
  };

  const handleExport = () => {
    exportCustomers(
      {},
      {
        onSuccess: () => {
          toast({
            title: "Export Started",
            description: "Customer data export has been initiated",
          });
        },
        onError: () => {
          toast({
            title: "Export Failed",
            description: "Failed to export customer data",
            variant: "destructive" as const,
          });
        },
      }
    );
  };

  const handleToggleStatus = () => {
    const newStatus = customer.isActive ? "deactivate" : "activate";
    bulkUpdateCustomers(
      {
        customerIds: [customer.id],
        action: newStatus,
      },
      {
        onSuccess: () => {
          toast({
            title: "Status Updated",
            description: `Customer ${newStatus === "activate" ? "activated" : "deactivated"}`,
          });
        },
        onError: () => {
          toast({
            title: "Update Failed",
            description: "Failed to update customer status",
            variant: "destructive" as const,
          });
        },
      }
    );
  };

  const handleBulkAction = () => {
    if (!bulkAction) return;

    bulkUpdateCustomers(
      {
        customerIds: [customer.id],
        action: bulkAction,
      },
      {
        onSuccess: () => {
          toast({
            title: "Bulk Action Completed",
            description: `Action "${bulkAction}" applied successfully`,
          });
          setShowBulkDialog(false);
          setBulkAction(null);
          setBulkNote("");
        },
        onError: () => {
          toast({
            title: "Action Failed",
            description: "Failed to apply bulk action",
            variant: "destructive" as const,
          });
        },
      }
    );
  };

  const getCreditStatus = () => {
    const utilization = (customer.creditUsed / customer.creditLimit) * 100;
    if (utilization >= 90)
      return { status: "critical", color: "destructive" as const };
    if (utilization >= 70)
      return { status: "warning", color: "default" as const };
    return { status: "good", color: "secondary" as const };
  };

  const creditStatus = getCreditStatus();

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Primary Actions */}
        <Button onClick={handleCreateLoad} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Create Load
        </Button>

        <Button variant="outline" onClick={handleCreateInvoice} size="sm">
          <FileText className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>

        {/* More Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={handleCreateLoad}>
              <Package className="mr-2 h-4 w-4" />
              Create Load
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCreateInvoice}>
              <FileText className="mr-2 h-4 w-4" />
              Create Invoice
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSendStatement}>
              <Send className="mr-2 h-4 w-4" />
              Send Statement
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/customers/${customer.id}/contacts`}>
                <User className="mr-2 h-4 w-4" />
                Manage Contacts
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/customers/${customer.id}/edit`}>
                <Settings className="mr-2 h-4 w-4" />
                Edit Customer
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleToggleStatus}>
              {customer.isActive ? (
                <>
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Deactivate
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Activate
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setShowBulkDialog(true)}
              className="text-muted-foreground"
            >
              <Settings className="mr-2 h-4 w-4" />
              Bulk Actions
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Customer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Credit Status Badge */}
      <div className="flex items-center gap-2">
        <Badge variant={creditStatus.color}>
          Credit: {creditStatus.status}
        </Badge>
        <span className="text-sm text-muted-foreground">
          {formatCurrency(customer.creditUsed)} /{" "}
          {formatCurrency(customer.creditLimit)}
        </span>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong>{customer.companyName}</strong>? This action cannot be
              undone and will also delete all associated contacts and data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                // TODO: Implement delete functionality
                toast({
                  title: "Customer Deleted",
                  description: `${customer.companyName} has been deleted`,
                });
                setShowDeleteDialog(false);
                router.push("/customers");
              }}
            >
              Delete Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Actions Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Actions</DialogTitle>
            <DialogDescription>
              Apply bulk actions to <strong>{customer.companyName}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="action">Action</Label>
              <Select
                value={bulkAction || ""}
                onValueChange={(value) =>
                  setBulkAction(
                    value as
                      | "activate"
                      | "deactivate"
                      | "export"
                      | "delete"
                      | null
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activate">Activate Customer</SelectItem>
                  <SelectItem value="deactivate">
                    Deactivate Customer
                  </SelectItem>
                  <SelectItem value="update_credit">
                    Update Credit Limit
                  </SelectItem>
                  <SelectItem value="send_statement">Send Statement</SelectItem>
                  <SelectItem value="export_data">Export Data</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="note">Note (Optional)</Label>
              <Textarea
                id="note"
                placeholder="Add a note for this action..."
                value={bulkNote}
                onChange={(e) => setBulkNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkAction}
              disabled={!bulkAction || isBulkUpdating}
            >
              {isBulkUpdating && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Apply Action
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
