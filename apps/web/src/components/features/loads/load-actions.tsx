"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDeleteLoad, useDuplicateLoad, useLoad } from "@/hooks/use-loads";
import {
  useGenerateDocument,
  useSendDocument,
  useExportLoad,
} from "@/hooks/use-load-actions";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Edit,
  Copy,
  Trash2,
  Download,
  Mail,
  FileText,
  X,
  Plus,
} from "lucide-react";
import { Select } from "@/components/ui/select";
import { SelectTrigger } from "@/components/ui/select";
import { SelectValue } from "@/components/ui/select";
import { SelectContent } from "@/components/ui/select";
import { SelectItem } from "@/components/ui/select";
import { CanEdit, CanDelete, CanCreate, CanView } from "@/components/auth/can";

interface LoadActionsProps {
  loadId: string;
}

export function LoadActions({ loadId }: LoadActionsProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>("");
  const [recipients, setRecipients] = useState<
    Array<{ email: string; name: string }>
  >([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const deleteLoad = useDeleteLoad();
  const duplicateLoad = useDuplicateLoad();
  const { data: load, error } = useLoad(loadId);
  const generateDocument = useGenerateDocument();
  const sendDocument = useSendDocument();
  const exportLoad = useExportLoad();

  // Don't render actions if load is not found
  if (error || !load) {
    return null;
  }

  const handleEdit = () => {
    router.push(`/loads/${loadId}/edit`);
  };

  const handleDuplicate = async () => {
    try {
      const newLoad = await duplicateLoad.mutateAsync(loadId);
      router.push(`/loads/${newLoad.id}`);
      toast.success("Load duplicated successfully");
    } catch (error) {
      toast.error("Failed to duplicate load");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteLoad.mutateAsync(loadId);
      router.push("/loads");
      toast.success("Load deleted successfully");
    } catch (error) {
      toast.error("Failed to delete load");
    }
  };

  const handleGenerateDocument = (documentType: string) => {
    generateDocument.mutate({ loadId, documentType });
    setShowGenerateDialog(false);
  };

  const handleSendDocument = () => {
    if (recipients.length === 0) {
      toast.error("Please add at least one recipient");
      return;
    }

    sendDocument.mutate({
      loadId,
      documentType: selectedDocumentType,
      recipients,
      subject,
      message,
    });

    setShowSendDialog(false);
    setRecipients([]);
    setSubject("");
    setMessage("");
  };

  const handleExport = () => {
    exportLoad.mutate({ loadId, loadNumber: load?.loadNumber });
  };

  const addRecipient = () => {
    setRecipients([...recipients, { email: "", name: "" }]);
  };

  const removeRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const updateRecipient = (
    index: number,
    field: "email" | "name",
    value: string
  ) => {
    const updated = [...recipients];
    updated[index][field] = value;
    setRecipients(updated);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <CanEdit resource="load">
            <DropdownMenuItem onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Load
            </DropdownMenuItem>
          </CanEdit>
          <CanCreate resource="load">
            <DropdownMenuItem
              onClick={handleDuplicate}
              disabled={duplicateLoad.isPending}
            >
              <Copy className="h-4 w-4 mr-2" />
              Duplicate Load
            </DropdownMenuItem>
          </CanCreate>
          <DropdownMenuSeparator />
          <CanCreate resource="document">
            <DropdownMenuItem onClick={() => setShowGenerateDialog(true)}>
              <FileText className="h-4 w-4 mr-2" />
              Generate Documents
            </DropdownMenuItem>
          </CanCreate>
          <CanCreate resource="document">
            <DropdownMenuItem onClick={() => setShowSendDialog(true)}>
              <Mail className="h-4 w-4 mr-2" />
              Send Documents
            </DropdownMenuItem>
          </CanCreate>
          <CanView resource="load">
            <DropdownMenuItem onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </DropdownMenuItem>
          </CanView>
          <DropdownMenuSeparator />
          <CanDelete resource="load">
            <DropdownMenuItem
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Load
            </DropdownMenuItem>
          </CanDelete>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Load</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this load? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} variant="destructive">
              {deleteLoad.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Document Generation Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Document</DialogTitle>
            <DialogDescription>
              Select the type of document you want to generate for this load.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={() => handleGenerateDocument("rate-confirmation")}
                disabled={generateDocument.isPending}
                className="h-20 flex flex-col items-center justify-center"
              >
                <FileText className="h-6 w-6 mb-2" />
                {generateDocument.isPending
                  ? "Generating..."
                  : "Rate Confirmation"}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleGenerateDocument("bol")}
                disabled={generateDocument.isPending}
                className="h-20 flex flex-col items-center justify-center"
              >
                <FileText className="h-6 w-6 mb-2" />
                {generateDocument.isPending
                  ? "Generating..."
                  : "Bill of Lading"}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleGenerateDocument("invoice")}
                disabled={generateDocument.isPending}
                className="h-20 flex flex-col items-center justify-center"
              >
                <FileText className="h-6 w-6 mb-2" />
                {generateDocument.isPending ? "Generating..." : "Invoice"}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleGenerateDocument("pod")}
                disabled={generateDocument.isPending}
                className="h-20 flex flex-col items-center justify-center"
              >
                <FileText className="h-6 w-6 mb-2" />
                {generateDocument.isPending
                  ? "Generating..."
                  : "Proof of Delivery"}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowGenerateDialog(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Sending Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Document</DialogTitle>
            <DialogDescription>
              Send a document to recipients via email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="document-type">Document Type</Label>
              <Select
                value={selectedDocumentType}
                onValueChange={setSelectedDocumentType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rate-confirmation">
                    Rate Confirmation
                  </SelectItem>
                  <SelectItem value="bol">Bill of Lading</SelectItem>
                  <SelectItem value="invoice">Invoice</SelectItem>
                  <SelectItem value="pod">Proof of Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Recipients</Label>
              <div className="space-y-2">
                {recipients.map((recipient, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Email"
                      value={recipient.email}
                      onChange={(e) =>
                        updateRecipient(index, "email", e.target.value)
                      }
                      className="flex-1"
                    />
                    <Input
                      placeholder="Name (optional)"
                      value={recipient.name}
                      onChange={(e) =>
                        updateRecipient(index, "name", e.target.value)
                      }
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => removeRecipient(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={addRecipient}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Recipient
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject"
              />
            </div>

            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Email message"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSendDocument}
              disabled={
                !selectedDocumentType ||
                recipients.length === 0 ||
                sendDocument.isPending
              }
            >
              {sendDocument.isPending ? "Sending..." : "Send Document"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
