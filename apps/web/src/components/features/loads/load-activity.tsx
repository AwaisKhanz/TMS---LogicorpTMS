"use client";

import { useLoadEvents } from "@/hooks/use-loads";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface LoadActivityProps {
  loadId: string;
}

interface EventData {
  oldStatus?: string;
  newStatus?: string;
  updatedFields?: string[];
  documentName?: string;
}

interface LoadEvent {
  id: string;
  eventType: string;
  eventData: EventData;
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
  };
}

export function LoadActivity({ loadId }: LoadActivityProps) {
  const { data: eventsData, isLoading } = useLoadEvents(loadId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-center h-20">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!eventsData || eventsData.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3">Recent Activity</h3>
          <p className="text-sm text-muted-foreground">No activity yet</p>
        </CardContent>
      </Card>
    );
  }

  // Transform events into activity items
  const activities = eventsData.map((event: LoadEvent) => {
    let title = "";
    let type: "info" | "success" | "primary" | "warning" = "info";

    switch (event.eventType) {
      case "LOAD_CREATED":
        title = "Load created";
        type = "success";
        break;
      case "STATUS_CHANGE": {
        const { oldStatus, newStatus } = event.eventData;
        title = `Status changed from ${oldStatus?.replace("_", " ")} to ${newStatus?.replace("_", " ")}`;
        type = "primary";
        break;
      }
      case "LOAD_UPDATED": {
        const { updatedFields } = event.eventData;
        title = `Load updated (${updatedFields?.join(", ")})`;
        type = "info";
        break;
      }
      case "CARRIER_ASSIGNED":
        title = "Carrier assigned";
        type = "success";
        break;
      case "CARRIER_UNASSIGNED":
        title = "Carrier unassigned";
        type = "warning";
        break;
      case "DOCUMENT_UPLOADED": {
        const { documentName } = event.eventData;
        title = `Document uploaded: ${documentName}`;
        type = "info";
        break;
      }
      default:
        title = event.eventType.replace("_", " ").toLowerCase();
        type = "info";
    }

    return {
      id: event.id,
      title,
      time: event.createdAt,
      type,
      user: event.user,
    };
  });

  const getActivityColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-success";
      case "primary":
        return "bg-primary";
      case "info":
        return "bg-muted";
      case "warning":
        return "bg-warning";
      default:
        return "bg-muted";
    }
  };

  const showMore = activities.length > 8;
  const displayActivities = showMore ? activities.slice(0, 8) : activities;

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="font-semibold mb-3">Recent Activity</h3>
        <div className="space-y-3 text-sm">
          {displayActivities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-2">
              <div
                className={`w-2 h-2 ${getActivityColor(activity.type)} rounded-full mt-2 flex-shrink-0`}
              />
              <div>
                <p className="font-medium">{activity.title}</p>
                <p className="text-xs text-muted-foreground">
                  {activity.user
                    ? `by ${activity.user.firstName} ${activity.user.lastName}`
                    : "by System"}{" "}
                  •{" "}
                  {formatDistanceToNow(new Date(activity.time), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>
          ))}
          {showMore && (
            <p className="text-xs text-muted-foreground text-center pt-2">
              +{activities.length - 8} more events
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
