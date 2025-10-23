"use client";

import { useLoadEvents } from "@/hooks/use-loads";
// Helper function to safely convert eventData
function convertEventData(eventData: unknown): Record<string, unknown> {
  if (eventData === null || eventData === undefined) {
    return {};
  }
  if (typeof eventData === "object" && eventData !== null) {
    return eventData as Record<string, unknown>;
  }
  // For primitive values, wrap in an object
  return { value: eventData };
}
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Clock,
  Package,
  Truck,
  FileCheck,
  User,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const eventIcons: Record<string, LucideIcon> = {
  LOAD_CREATED: Package,
  LOAD_UPDATED: FileCheck,
  STATUS_CHANGE: Truck,
  CARRIER_ASSIGNED: User,
  LOAD_DUPLICATED: Package,
  DOCUMENT_UPLOADED: FileCheck,
  DEFAULT: Clock,
};

const eventColors: Record<string, string> = {
  LOAD_CREATED: "bg-blue-500",
  LOAD_UPDATED: "bg-yellow-500",
  STATUS_CHANGE: "bg-purple-500",
  CARRIER_ASSIGNED: "bg-green-500",
  LOAD_DUPLICATED: "bg-blue-500",
  DOCUMENT_UPLOADED: "bg-indigo-500",
  DEFAULT: "bg-gray-500",
};

interface LoadTimelineProps {
  loadId: string;
}

export function LoadTimeline({ loadId }: LoadTimelineProps) {
  const { data: events, isLoading } = useLoadEvents(loadId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!events || events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No events yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {events.map((event, index) => {
              const Icon = eventIcons[event.eventType] || eventIcons.DEFAULT;
              const iconColor =
                eventColors[event.eventType] || eventColors.DEFAULT;
              const isLast = index === events.length - 1;

              return (
                <div key={event.id} className="relative flex gap-4">
                  {/* Timeline line */}
                  {!isLast && (
                    <div className="absolute left-4 top-10 h-full w-px bg-border" />
                  )}

                  {/* Icon */}
                  <div
                    className={cn(
                      "relative z-10 flex h-8 w-8 items-center justify-center rounded-full",
                      iconColor
                    )}
                  >
                    <Icon className="h-4 w-4 text-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-1 pb-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        {getEventTitle({
                          ...event,
                          eventData: convertEventData(event.eventData),
                        })}
                      </p>
                      <time className="text-xs text-muted-foreground">
                        {format(new Date(event.createdAt), "MMM dd, HH:mm")}
                      </time>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {getEventDescription({
                        ...event,
                        eventData: convertEventData(event.eventData),
                      })}
                    </p>
                    {event.user && (
                      <p className="text-xs text-muted-foreground">
                        by {event.user.firstName} {event.user.lastName}
                      </p>
                    )}
                    {event.eventData &&
                      Object.keys(convertEventData(event.eventData)).length >
                        0 && (
                        <div className="mt-2 rounded-md bg-muted p-2">
                          {renderEventData(convertEventData(event.eventData))}
                        </div>
                      )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

interface LoadEvent {
  eventType: string;
  eventData: Record<string, unknown>;
  createdAt: string | Date;
}

function getEventTitle(event: LoadEvent): string {
  const titles: Record<string, string> = {
    LOAD_CREATED: "Load Created",
    LOAD_UPDATED: "Load Updated",
    STATUS_CHANGE: "Status Changed",
    CARRIER_ASSIGNED: "Carrier Assigned",
    LOAD_DUPLICATED: "Load Duplicated",
    DOCUMENT_UPLOADED: "Document Uploaded",
    DOCUMENT_DELETED: "Document Deleted",
  };

  return titles[event.eventType] || event.eventType.replace(/_/g, " ");
}

function getEventDescription(event: LoadEvent): string {
  const { eventType, eventData } = event;

  switch (eventType) {
    case "LOAD_CREATED":
      return `Load created with status ${eventData.status}`;
    case "STATUS_CHANGE":
      return `Status changed from ${eventData.oldStatus} to ${eventData.newStatus}`;
    case "CARRIER_ASSIGNED":
      return `Carrier ${eventData.carrierName} assigned`;
    case "LOAD_UPDATED":
      return `Updated: ${Array.isArray(eventData.updatedFields) ? eventData.updatedFields.join(", ") : "multiple fields"}`;
    case "LOAD_DUPLICATED":
      return `Duplicated from load ${eventData.originalLoadNumber}`;
    case "DOCUMENT_UPLOADED":
      return `Document uploaded: ${eventData.documentName}`;
    case "DOCUMENT_DELETED":
      return `Document deleted: ${eventData.documentName}`;
    default:
      return "Event occurred";
  }
}

function renderEventData(data: Record<string, unknown>) {
  return (
    <div className="space-y-1">
      {Object.entries(data).map(([key, value]) => {
        // Skip certain fields
        if (
          ["createdBy", "updatedBy", "assignedBy", "uploadedBy"].includes(key)
        ) {
          return null;
        }

        return (
          <div key={key} className="flex justify-between text-xs">
            <span className="font-medium capitalize">
              {key.replace(/([A-Z])/g, " $1")}:
            </span>
            <span className="text-muted-foreground">
              {typeof value === "object"
                ? JSON.stringify(value)
                : String(value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
