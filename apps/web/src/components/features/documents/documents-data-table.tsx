"use client";

import { useState } from "react";
import { useDocuments } from "@/hooks/use-documents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  FileText,
  Download,
  Trash2,
  ExternalLink,
  Calendar,
  HardDrive,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import type { ApiErrorException } from "@/types/api.types";
import type { Document } from "@tms/shared-types";

const documentTypeLabels: Record<string, string> = {
  RATE_CONFIRMATION: "Rate Confirmation",
  BOL: "Bill of Lading",
  POD: "Proof of Delivery",
  INVOICE: "Invoice",
  W9: "W-9 Form",
  INSURANCE: "Insurance Certificate",
  AUTHORITY: "Authority Document",
  CONTRACT: "Contract",
  OTHER: "Other",
};

const entityTypeLabels: Record<string, string> = {
  LOAD: "Load",
  CARRIER: "Carrier",
  CUSTOMER: "Customer",
  INVOICE: "Invoice",
  USER: "User",
};

const entityTypeColors: Record<string, string> = {
  LOAD: "bg-blue-100 text-blue-800",
  CARRIER: "bg-green-100 text-green-800",
  CUSTOMER: "bg-purple-100 text-purple-800",
  INVOICE: "bg-orange-100 text-orange-800",
  USER: "bg-gray-100 text-gray-800",
};

export function DocumentsDataTable() {
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);
  const [filters] = useState({});

  const { data, isLoading, refetch } = useDocuments(filters);

  const documents = data?.documents || [];
  const pagination = data?.pagination;

  const handleDelete = async () => {
    if (!deleteDocId) return;

    try {
      await apiClient.delete(`/documents/${deleteDocId}`);
      toast.success("Document deleted successfully");
      setDeleteDocId(null);
      refetch();
    } catch (error) {
      const apiError = error as ApiErrorException;
      toast.error(
        apiError.response?.data?.error?.message || "Failed to delete document"
      );
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const response = await apiClient.get<Blob>(
        `/documents/${doc.id}/download`,
        {
          responseType: "blob",
        }
      );

      // Ensure filename has proper extension for PDFs
      let filename = doc.name;
      if (doc.mimeType === 'application/pdf' && !filename.toLowerCase().endsWith('.pdf')) {
        filename = `${filename}.pdf`;
      }

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Failed to download document");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getEntityLink = (entityType: string, entityId: string) => {
    const baseUrl = {
      LOAD: `/loads/${entityId}`,
      CARRIER: `/carriers/${entityId}`,
      CUSTOMER: `/customers/${entityId}`,
      INVOICE: `/invoices/${entityId}`,
      USER: `/users/${entityId}`,
    }[entityType];

    return baseUrl || "#";
  };

  if (isLoading) {
    return <div>Loading documents...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            All Documents
            {pagination && (
              <Badge variant="secondary">{pagination.total} total</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          No documents found
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  documents.map((doc: Document) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {doc.mimeType}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {documentTypeLabels[doc.type] || doc.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={entityTypeColors[doc.entityType]}
                          >
                            {entityTypeLabels[doc.entityType]}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            asChild
                          >
                            <a
                              href={getEntityLink(doc.entityType, doc.entityId)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <HardDrive className="h-3 w-3 text-muted-foreground" />
                          {formatFileSize(doc.fileSize)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {format(new Date(doc.uploadedAt), "MMM dd, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>
                        {doc.expiresAt ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {format(new Date(doc.expiresAt), "MMM dd, yyyy")}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDownload(doc)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => setDeleteDocId(doc.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                of {pagination.total} documents
              </p>
              {/* Add pagination controls here */}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteDocId}
        onOpenChange={() => setDeleteDocId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This action cannot
              be undone.
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
    </>
  );
}
