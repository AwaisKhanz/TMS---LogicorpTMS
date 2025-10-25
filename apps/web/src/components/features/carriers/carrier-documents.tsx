"use client";

import { useState, useRef } from "react";
import { useCarrierDocuments } from "@/hooks/use-carriers";
import { useDownloadDocument } from "@/hooks/use-documents";
import { useQueryClient } from "@tanstack/react-query";
import type { CarrierDocument } from "@/types/carrier.types";
import type { ApiErrorException } from "@/types/api.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Upload,
  Download,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

const documentTypeLabels: Record<string, string> = {
  W9: "W-9 Form",
  INSURANCE: "Insurance Certificate",
  AUTHORITY: "Authority Document",
  CONTRACT: "Contract",
  OTHER: "Other",
};

const requiredDocuments = ["W9", "INSURANCE", "AUTHORITY"];

interface CarrierDocumentsProps {
  carrierId: string;
}

export function CarrierDocuments({ carrierId }: CarrierDocumentsProps) {
  const queryClient = useQueryClient();
  const {
    data: documents,
    isLoading,
    refetch,
  } = useCarrierDocuments(carrierId);
  const downloadDocument = useDownloadDocument();

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setDocumentName(file.name);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !documentType) {
      toast.error("Please select a file and document type");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("entityType", "CARRIER");
      formData.append("entityId", carrierId);
      formData.append("type", documentType);
      formData.append("name", documentName);

      await apiClient.post("/documents/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("Document uploaded successfully");
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setDocumentType("");
      setDocumentName("");

      // Aggressive cache invalidation
      queryClient.invalidateQueries({
        queryKey: ["carrier-documents", carrierId],
      });
      queryClient.invalidateQueries({ queryKey: ["carriers", carrierId] });
      queryClient.invalidateQueries({ queryKey: ["carriers"] });
      queryClient.refetchQueries({
        queryKey: ["carrier-documents", carrierId],
      });
      refetch();
    } catch (error) {
      const apiError = error as ApiErrorException;
      toast.error(
        apiError.response?.data?.error?.message || "Failed to upload document"
      );
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const hasRequiredDocument = (type: string) => {
    return documents?.some((doc: CarrierDocument) => doc.type === type);
  };

  const handleDownload = async (document: CarrierDocument) => {
    downloadDocument.mutate({
      id: document.id,
      name: document.name,
      mimeType: document.mimeType,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents
          </CardTitle>
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Document</DialogTitle>
                <DialogDescription>
                  Upload a document for this carrier
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Document Type</Label>
                  <Select value={documentType} onValueChange={setDocumentType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(documentTypeLabels).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>File</Label>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={handleFileSelect}
                  />
                  {selectedFile && (
                    <p className="text-xs text-muted-foreground">
                      Selected: {selectedFile.name} (
                      {formatFileSize(selectedFile.size)})
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Document Name</Label>
                  <Input
                    placeholder="Enter document name"
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setUploadDialogOpen(false)}
                  disabled={uploading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={uploading || !selectedFile}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* Required Documents Checklist */}
        <div className="mb-4 p-3 bg-muted rounded-lg space-y-2">
          <p className="text-sm font-medium">Required Documents</p>
          <div className="space-y-1">
            {requiredDocuments.map((docType) => (
              <div
                key={docType}
                className="flex items-center justify-between text-sm"
              >
                <span>{documentTypeLabels[docType]}</span>
                {hasRequiredDocument(docType) ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
              </div>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !documents || documents.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              No documents uploaded yet
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {documents.map((doc: CarrierDocument) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Badge variant="outline" className="text-xs">
                          {documentTypeLabels[doc.type] || doc.type}
                        </Badge>
                        <span>•</span>
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span>•</span>
                        <span>
                          {format(new Date(doc.uploadedAt), "MMM dd, yyyy")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDownload(doc)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
