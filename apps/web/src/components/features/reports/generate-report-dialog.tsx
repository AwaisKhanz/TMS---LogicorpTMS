"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ReportFormat } from "@tms/shared-types";

const generateReportSchema = z.object({
  format: z.nativeEnum(ReportFormat),
});

type GenerateReportFormData = z.infer<typeof generateReportSchema>;

const reportFormatOptions = [
  { value: "PDF", label: "PDF" },
  { value: "EXCEL", label: "Excel" },
  { value: "CSV", label: "CSV" },
  { value: "JSON", label: "JSON" },
];

interface GenerateReportDialogProps {
  reportId: string | null;
  onClose: () => void;
  onConfirm: (data: GenerateReportFormData) => void;
  isGenerating: boolean;
}

export function GenerateReportDialog({
  reportId,
  onClose,
  onConfirm,
  isGenerating,
}: GenerateReportDialogProps) {
  const form = useForm<GenerateReportFormData>({
    resolver: zodResolver(generateReportSchema),
    defaultValues: {
      format: ReportFormat.PDF,
    },
  });

  const handleSubmit = (data: GenerateReportFormData) => {
    onConfirm(data);
  };

  return (
    <Dialog open={!!reportId} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Generate Report</DialogTitle>
          <DialogDescription>
            Choose the format for your report generation. The report will be
            processed and you&apos;ll be notified when it&apos;s ready.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="format"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Report Format</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {reportFormatOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isGenerating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isGenerating}>
                {isGenerating ? "Generating..." : "Generate Report"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
