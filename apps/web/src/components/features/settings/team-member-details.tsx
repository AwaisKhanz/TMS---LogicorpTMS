"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building } from "lucide-react";
import { CustomerAssignment } from "./customer-assignment";
import {
  useMemberCustomers,
  useAssignCustomers,
  useRemoveCustomerAssignment,
} from "@/hooks/use-customer-assignment";
import { useCustomers } from "@/hooks/use-customer";

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
  assignedCustomers?: unknown[];
  isActive: boolean;
  lastLogin?: string | null;
  invitedAt?: string | null;
  joinedAt?: string | null;
}

interface TeamMemberDetailsProps {
  member: TeamMember;
}

export function TeamMemberDetails({ member }: TeamMemberDetailsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: assignedCustomers = [] } = useMemberCustomers(member.id);
  const { data: customersData } = useCustomers();
  const availableCustomers = customersData?.data || [];
  const assignCustomers = useAssignCustomers(member.id);
  const removeCustomerAssignment = useRemoveCustomerAssignment(member.id);

  const handleAssign = (customerIds: string[]) => {
    assignCustomers.mutate({ customerIds });
  };

  const handleRemove = (customerId: string) => {
    removeCustomerAssignment.mutate(customerId);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          View Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                {member.firstName[0]}
                {member.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold">
                {member.firstName} {member.lastName}
              </div>
              <div className="text-sm text-muted-foreground">
                {member.email}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Member Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Member Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Status
                  </label>
                  <div className="mt-1">
                    <Badge variant={member.isActive ? "default" : "secondary"}>
                      {member.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Last Login
                  </label>
                  <div className="mt-1 text-sm">
                    {formatDate(member.lastLogin)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Joined
                  </label>
                  <div className="mt-1 text-sm">
                    {formatDate(member.joinedAt)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Invited
                  </label>
                  <div className="mt-1 text-sm">
                    {formatDate(member.invitedAt)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Roles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Roles & Permissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {member.roles.map((role) => (
                  <Badge key={role} variant="outline">
                    {role}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Customer Assignments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Customer Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CustomerAssignment
                assignedCustomers={assignedCustomers}
                availableCustomers={availableCustomers}
                onAssign={handleAssign}
                onRemove={handleRemove}
                disabled={
                  assignCustomers.isPending ||
                  removeCustomerAssignment.isPending
                }
              />
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
