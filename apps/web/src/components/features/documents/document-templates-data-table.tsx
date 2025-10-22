"use client";

import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  FileText,
  Edit,
  Trash2,
  Star,
  Calendar,
  User,
  Copy,
  Eye
} from "lucide-react";
import { format } from "date-fns";
import {
  useDocumentTemplates,
  useDeleteDocumentTemplate,
  useSetDefaultTemplate,
  useDuplicateDocumentTemplate,
  useUpdateDocumentTemplate,
} from "@/hooks/use-document-templates";
import type { DocumentTemplate, UpdateDocumentTemplateRequest } from "@tms/shared-types";

const documentTypeLabels: Record<string, string> = {
  RATE_CONFIRMATION: "Rate Confirmation",
  BOL: "Bill of Lading",
  POD: "Proof of Delivery",
  INVOICE: "Invoice",
  CONTRACT: "Contract",
  OTHER: "Other",
};

const documentTypeColors: Record<string, string> = {
  RATE_CONFIRMATION: "bg-blue-100 text-blue-800",
  BOL: "bg-green-100 text-green-800",
  POD: "bg-purple-100 text-purple-800",
  INVOICE: "bg-orange-100 text-orange-800",
  CONTRACT: "bg-indigo-100 text-indigo-800",
  OTHER: "bg-gray-100 text-gray-800",
};

export function DocumentTemplatesDataTable() {
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);
  const [editTemplate, setEditTemplate] = useState<DocumentTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<DocumentTemplate | null>(null);

  const { data: templates = [], isLoading } = useDocumentTemplates();
  const deleteTemplateMutation = useDeleteDocumentTemplate();
  const setDefaultMutation = useSetDefaultTemplate();
  const duplicateMutation = useDuplicateDocumentTemplate();
  const updateMutation = useUpdateDocumentTemplate();

  const handleDelete = async () => {
    if (!deleteTemplateId) return;
    deleteTemplateMutation.mutate(deleteTemplateId, {
      onSuccess: () => setDeleteTemplateId(null),
    });
  };

  const handleSetDefault = async (templateId: string) => {
    setDefaultMutation.mutate(templateId);
  };

  const handleDuplicate = async (template: DocumentTemplate) => {
    duplicateMutation.mutate(template);
  };

  const handleEdit = async (template: DocumentTemplate) => {
    if (!editTemplate) return;

    const updateData: UpdateDocumentTemplateRequest = {
      name: editTemplate.name,
      template: editTemplate.template,
      isDefault: editTemplate.isDefault,
    };

    updateMutation.mutate(
      { id: template.id, data: updateData },
      {
        onSuccess: () => setEditTemplate(null),
      }
    );
  };

  if (isLoading) {
    return <div>Loading templates...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Templates
            <Badge variant="secondary">
              {templates.length} templates
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Default</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Creator</TableHead>
                  <TableHead className="w-[150px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          No templates found
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{template.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Modified {format(new Date(template.updatedAt), "MMM dd, yyyy")}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={documentTypeColors[template.type]}
                        >
                          {documentTypeLabels[template.type] || template.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {template.isDefault ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <Star className="h-3 w-3 mr-1" />
                            Default
                          </Badge>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetDefault(template.id)}
                            className="text-xs"
                          >
                            Set Default
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {format(new Date(template.createdAt), "MMM dd, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <User className="h-3 w-3 text-muted-foreground" />
                          Created by user
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setPreviewTemplate(template)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditTemplate(template)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDuplicate(template)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => setDeleteTemplateId(template.id)}
                            disabled={template.isDefault}
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
        </CardContent>
      </Card>

      {/* Preview Template Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Template Preview: {previewTemplate?.name}</DialogTitle>
            <DialogDescription>
              Preview of the HTML template content
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-muted">
              <pre className="text-sm overflow-auto max-h-[400px]">
                {previewTemplate?.template}
              </pre>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setPreviewTemplate(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={!!editTemplate} onOpenChange={() => setEditTemplate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>
              Modify the template details and content
            </DialogDescription>
          </DialogHeader>
          {editTemplate && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Template Name</Label>
                <Input
                  value={editTemplate.name}
                  onChange={(e) => setEditTemplate({...editTemplate, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>HTML Template</Label>
                <Textarea
                  value={editTemplate.template}
                  onChange={(e) => setEditTemplate({...editTemplate, template: e.target.value})}
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={editTemplate.isDefault}
                  onCheckedChange={(checked) =>
                    setEditTemplate({...editTemplate, isDefault: checked as boolean})
                  }
                />
                <Label>Set as default template</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTemplate(null)}>
              Cancel
            </Button>
            <Button onClick={() => editTemplate && handleEdit(editTemplate)}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTemplateId}
        onOpenChange={() => setDeleteTemplateId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this template? This action cannot
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