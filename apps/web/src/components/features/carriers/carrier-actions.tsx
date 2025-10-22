"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useDeleteCarrier,
  useApproveCarrier,
  useCarrier,
} from "@/hooks/use-carriers";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  MoreHorizontal,
  Edit,
  Trash2,
  UserCheck,
  Download,
  Mail,
} from "lucide-react";

interface CarrierActionsProps {
  carrierId: string;
}

export function CarrierActions({ carrierId }: CarrierActionsProps) {
  const router = useRouter();
  const { data: carrier } = useCarrier(carrierId);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const deleteCarrier = useDeleteCarrier();
  const approveCarrier = useApproveCarrier();

  const handleEdit = () => {
    router.push(`/carriers/${carrierId}/edit`);
  };

  const handleDelete = async () => {
    await deleteCarrier.mutateAsync(carrierId);
    router.push("/carriers");
  };

  const handleApprove = async () => {
    await approveCarrier.mutateAsync(carrierId);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {carrier && !carrier.isApproved && (
          <Button onClick={handleApprove} disabled={approveCarrier.isPending}>
            <UserCheck className="h-4 w-4 mr-2" />
            {approveCarrier.isPending ? "Approving..." : "Approve Carrier"}
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Carrier
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Mail className="h-4 w-4 mr-2" />
              Send Documents
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download className="h-4 w-4 mr-2" />
              Export Carrier Info
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Carrier
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Carrier</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this carrier? This action cannot
              be undone. Carriers with active loads cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCarrier.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
