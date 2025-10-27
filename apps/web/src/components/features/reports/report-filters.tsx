"use client";

import React, { useState } from "react";
import { Search, Filter, Download, Trash2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { ReportFilters } from "@tms/shared-types";
import { CanDelete } from "@/components/auth/can";

const reportTypeOptions = [
  { value: "LOAD_ANALYTICS", label: "Load Analytics" },
  { value: "CARRIER_PERFORMANCE", label: "Carrier Performance" },
  { value: "CUSTOMER_ANALYTICS", label: "Customer Analytics" },
  { value: "REVENUE_ANALYSIS", label: "Revenue Analysis" },
  { value: "OPERATIONAL_METRICS", label: "Operational Metrics" },
  { value: "TEAM_PERFORMANCE", label: "Team Performance" },
  { value: "FINANCIAL_SUMMARY", label: "Financial Summary" },
  { value: "CUSTOM", label: "Custom Report" },
];

const reportStatusOptions = [
  { value: "DRAFT", label: "Draft" },
  { value: "GENERATED", label: "Generated" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "FAILED", label: "Failed" },
];

const reportFormatOptions = [
  { value: "PDF", label: "PDF" },
  { value: "EXCEL", label: "Excel" },
  { value: "CSV", label: "CSV" },
  { value: "JSON", label: "JSON" },
];

const timeRangeOptions = [
  { value: "TODAY", label: "Today" },
  { value: "YESTERDAY", label: "Yesterday" },
  { value: "THIS_WEEK", label: "This Week" },
  { value: "LAST_WEEK", label: "Last Week" },
  { value: "THIS_MONTH", label: "This Month" },
  { value: "LAST_MONTH", label: "Last Month" },
  { value: "THIS_QUARTER", label: "This Quarter" },
  { value: "LAST_QUARTER", label: "Last Quarter" },
  { value: "THIS_YEAR", label: "This Year" },
  { value: "LAST_YEAR", label: "Last Year" },
  { value: "CUSTOM", label: "Custom Range" },
];

interface ReportFiltersProps {
  filters: ReportFilters;
  onFiltersChange: (filters: ReportFilters) => void;
  onExport: () => void;
  selectedCount: number;
  onBulkDelete: () => void;
  isBulkDeleting: boolean;
}

export function ReportFilters({
  filters,
  onFiltersChange,
  onExport,
  selectedCount,
  onBulkDelete,
  isBulkDeleting,
}: ReportFiltersProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>(
    filters.customDateFrom ? new Date(filters.customDateFrom) : undefined
  );
  const [customDateTo, setCustomDateTo] = useState<Date | undefined>(
    filters.customDateTo ? new Date(filters.customDateTo) : undefined
  );

  const updateFilter = (key: keyof ReportFilters, value: unknown) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      page: 1,
      limit: 50,
    });
    setCustomDateFrom(undefined);
    setCustomDateTo(undefined);
  };

  const hasActiveFilters = () => {
    return !!(
      filters.search ||
      filters.type ||
      filters.status ||
      filters.format ||
      filters.timeRange ||
      filters.tags?.length ||
      filters.createdBy
    );
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.type) count++;
    if (filters.status) count++;
    if (filters.format) count++;
    if (filters.timeRange) count++;
    if (filters.tags?.length) count++;
    if (filters.createdBy) count++;
    return count;
  };

  const handleCustomDateChange = (
    from: Date | undefined,
    to: Date | undefined
  ) => {
    setCustomDateFrom(from);
    setCustomDateTo(to);
    updateFilter("customDateFrom", from?.toISOString());
    updateFilter("customDateTo", to?.toISOString());
  };

  return (
    <div className="space-y-4">
      {/* Search and Actions Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search reports..."
              value={filters.search || ""}
              onChange={(e) => updateFilter("search", e.target.value)}
              className="pl-8"
            />
          </div>

          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filters
                {getActiveFilterCount() > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {getActiveFilterCount()}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Filters</h4>
                  {hasActiveFilters() && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Clear All
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Type</label>
                    <Select
                      value={filters.type || ""}
                      onValueChange={(value) =>
                        updateFilter("type", value || undefined)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All types</SelectItem>
                        {reportTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <Select
                      value={filters.status || ""}
                      onValueChange={(value) =>
                        updateFilter("status", value || undefined)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All statuses</SelectItem>
                        {reportStatusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Format</label>
                    <Select
                      value={filters.format || ""}
                      onValueChange={(value) =>
                        updateFilter("format", value || undefined)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All formats" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All formats</SelectItem>
                        {reportFormatOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Time Range</label>
                    <Select
                      value={filters.timeRange || ""}
                      onValueChange={(value) =>
                        updateFilter("timeRange", value || undefined)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All time</SelectItem>
                        {timeRangeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {filters.timeRange === "CUSTOM" && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Custom Date Range
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "justify-start text-left font-normal",
                                !customDateFrom && "text-muted-foreground"
                              )}
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              {customDateFrom
                                ? format(customDateFrom, "MMM dd, yyyy")
                                : "From"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={customDateFrom}
                              onSelect={(date) =>
                                handleCustomDateChange(date, customDateTo)
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "justify-start text-left font-normal",
                                !customDateTo && "text-muted-foreground"
                              )}
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              {customDateTo
                                ? format(customDateTo, "MMM dd, yyyy")
                                : "To"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={customDateTo}
                              onSelect={(date) =>
                                handleCustomDateChange(customDateFrom, date)
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center space-x-2">
          {selectedCount > 0 && (
            <CanDelete resource="report">
              <Button
                variant="destructive"
                size="sm"
                onClick={onBulkDelete}
                disabled={isBulkDeleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete ({selectedCount})
              </Button>
            </CanDelete>
          )}

          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Active Filters */}
      {hasActiveFilters() && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Search: {filters.search}
              <button
                onClick={() => updateFilter("search", undefined)}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                ×
              </button>
            </Badge>
          )}
          {filters.type && (
            <Badge variant="secondary" className="gap-1">
              Type:{" "}
              {
                reportTypeOptions.find((opt) => opt.value === filters.type)
                  ?.label
              }
              <button
                onClick={() => updateFilter("type", undefined)}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                ×
              </button>
            </Badge>
          )}
          {filters.status && (
            <Badge variant="secondary" className="gap-1">
              Status:{" "}
              {
                reportStatusOptions.find((opt) => opt.value === filters.status)
                  ?.label
              }
              <button
                onClick={() => updateFilter("status", undefined)}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                ×
              </button>
            </Badge>
          )}
          {filters.format && (
            <Badge variant="secondary" className="gap-1">
              Format:{" "}
              {
                reportFormatOptions.find((opt) => opt.value === filters.format)
                  ?.label
              }
              <button
                onClick={() => updateFilter("format", undefined)}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                ×
              </button>
            </Badge>
          )}
          {filters.timeRange && (
            <Badge variant="secondary" className="gap-1">
              Time:{" "}
              {
                timeRangeOptions.find((opt) => opt.value === filters.timeRange)
                  ?.label
              }
              <button
                onClick={() => updateFilter("timeRange", undefined)}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                ×
              </button>
            </Badge>
          )}
          {filters.tags?.length && (
            <Badge variant="secondary" className="gap-1">
              Tags: {filters.tags.length}
              <button
                onClick={() => updateFilter("tags", undefined)}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                ×
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
