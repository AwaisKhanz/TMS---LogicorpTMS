"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Plus, Filter, Search } from "lucide-react";
import { useCreateDocumentTemplate } from "@/hooks/use-document-templates";
import type { DocumentType, CreateDocumentTemplateRequest } from "@tms/shared-types";

const documentTypes = [
  { value: "RATE_CONFIRMATION", label: "Rate Confirmation" },
  { value: "BOL", label: "Bill of Lading" },
  { value: "POD", label: "Proof of Delivery" },
  { value: "INVOICE", label: "Invoice" },
  { value: "CONTRACT", label: "Contract" },
  { value: "OTHER", label: "Other" },
];

interface DocumentTemplatesHeaderProps {
  onSearch?: (query: string) => void;
  onFilter?: (filters: { type?: DocumentType; isDefault?: boolean }) => void;
  totalCount?: number;
}

interface TemplateFilters {
  type?: DocumentType;
  isDefault?: boolean;
}

export function DocumentTemplatesHeader({
  onSearch,
  onFilter,
  totalCount = 0
}: DocumentTemplatesHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<TemplateFilters>({});

  const createMutation = useCreateDocumentTemplate();

  const [templateForm, setTemplateForm] = useState({
    name: "",
    type: "" as DocumentType,
    template: "",
    isDefault: false,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  const handleFilterApply = (filters: TemplateFilters) => {
    setActiveFilters(filters);
    onFilter?.(filters);
    setFilterDialogOpen(false);
  };

  const clearFilters = () => {
    setActiveFilters({});
    onFilter?.({});
  };

  const handleCreateTemplate = async () => {
    if (!templateForm.name || !templateForm.type) return;

    const createData: CreateDocumentTemplateRequest = {
      name: templateForm.name,
      type: templateForm.type,
      template: templateForm.template,
      isDefault: templateForm.isDefault,
    };

    createMutation.mutate(createData, {
      onSuccess: () => {
        setCreateDialogOpen(false);
        setTemplateForm({ name: "", type: "" as DocumentType, template: "", isDefault: false });
      },
    });
  };

  const activeFilterCount = Object.keys(activeFilters).filter(
    key => activeFilters[key as keyof TemplateFilters]
  ).length;

  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Document Templates
          </h1>
          <p className="text-muted-foreground">
            Manage customizable templates for Rate Confirmations, BOLs, and other documents
            {totalCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {totalCount} templates
              </Badge>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-[300px]"
            />
          </form>

          {/* Filters */}
          <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Filter Templates</DialogTitle>
                <DialogDescription>
                  Filter templates by type or other criteria
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Document Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="All document types" />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Default Templates Only</Label>
                  <Checkbox />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
                <Button onClick={() => handleFilterApply({})}>
                  Apply Filters
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Create Template */}
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Document Template</DialogTitle>
                <DialogDescription>
                  Create a new customizable template for document generation
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Template Name</Label>
                    <Input
                      placeholder="e.g., Standard Rate Confirmation"
                      value={templateForm.name}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Document Type</Label>
                    <Select
                      value={templateForm.type}
                      onValueChange={(value) => setTemplateForm(prev => ({ ...prev, type: value as DocumentType }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                      <SelectContent>
                        {documentTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>HTML Template</Label>
                  <Textarea
                    placeholder="Enter HTML template content with variables like {{loadNumber}}, {{customerName}}, etc."
                    value={templateForm.template}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, template: e.target.value }))}
                    className="min-h-[200px] font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use variables like loadNumber, customerName, pickupDate, etc. for dynamic content
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isDefault"
                    checked={templateForm.isDefault}
                    onCheckedChange={(checked) =>
                      setTemplateForm(prev => ({ ...prev, isDefault: checked as boolean }))
                    }
                  />
                  <Label htmlFor="isDefault">Set as default template for this document type</Label>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTemplate} disabled={!templateForm.name || !templateForm.type}>
                  Create Template
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {Object.entries(activeFilters).map(([key, value]) =>
            value ? (
              <Badge key={key} variant="secondary">
                {key}: {String(value)}
              </Badge>
            ) : null
          )}
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear all
          </Button>
        </div>
      )}
    </>
  );
}