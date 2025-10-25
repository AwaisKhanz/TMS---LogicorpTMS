"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useDeleteCarrier,
  useApproveCarrier,
  useCarrier,
  useExportCarriers,
} from "@/hooks/use-carriers";
import { useCarrierDocuments } from "@/hooks/use-carriers";
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
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface CarrierActionsProps {
  carrierId: string;
}

export function CarrierActions({ carrierId }: CarrierActionsProps) {
  const router = useRouter();
  const { data: carrier } = useCarrier(carrierId);
  const { data: documents } = useCarrierDocuments(carrierId);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSendDocumentsDialog, setShowSendDocumentsDialog] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const deleteCarrier = useDeleteCarrier();
  const approveCarrier = useApproveCarrier();
  const exportCarriers = useExportCarriers();

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

  const handleSendDocuments = () => {
    setEmailSubject(`Documents for ${carrier?.companyName || "Carrier"}`);
    setEmailMessage(`Please find the attached documents for your records.`);
    setSelectedDocuments([]);
    setShowSendDocumentsDialog(true);
  };

  const handleDocumentToggle = (documentId: string) => {
    setSelectedDocuments((prev) =>
      prev.includes(documentId)
        ? prev.filter((id) => id !== documentId)
        : [...prev, documentId]
    );
  };

  const handleSendEmail = async () => {
    if (selectedDocuments.length === 0) {
      toast.error("Please select at least one document to send");
      return;
    }

    setIsSending(true);
    try {
      // TODO: Implement actual email sending API call
      // For now, simulate the process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast.success(
        `Documents sent successfully to ${carrier?.email || "carrier"}`
      );
      setShowSendDocumentsDialog(false);
      setSelectedDocuments([]);
    } catch (error) {
      toast.error("Failed to send documents");
    } finally {
      setIsSending(false);
    }
  };

  const handleExportCarrier = () => {
    exportCarriers.mutate({
      format: "csv",
      carrierId: carrierId,
    });
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
            <DropdownMenuItem onClick={handleSendDocuments}>
              <Mail className="h-4 w-4 mr-2" />
              Send Documents
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportCarrier}>
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
            <AlertDialogAction onClick={handleDelete} variant="destructive">
              {deleteCarrier.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={showSendDocumentsDialog}
        onOpenChange={setShowSendDocumentsDialog}
      >
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Send Documents</AlertDialogTitle>
            <AlertDialogDescription>
              Select documents to send to {carrier?.companyName} at{" "}
              {carrier?.email}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            {/* Email Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Email Subject</Label>
              <Input
                id="subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Enter email subject"
              />
            </div>

            {/* Email Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Email Message</Label>
              <Textarea
                id="message"
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                placeholder="Enter email message"
                rows={3}
              />
            </div>

            {/* Document Selection */}
            <div className="space-y-2">
              <Label>Select Documents to Send</Label>
              {documents && documents.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={doc.id}
                        checked={selectedDocuments.includes(doc.id)}
                        onCheckedChange={() => handleDocumentToggle(doc.id)}
                      />
                      <Label htmlFor={doc.id} className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {doc.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {doc.type}
                          </span>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No documents available to send
                </p>
              )}
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSendEmail}
              disabled={isSending || selectedDocuments.length === 0}
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Documents
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
