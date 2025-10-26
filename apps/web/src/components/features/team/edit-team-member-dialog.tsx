"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUpdateTeamMember } from "@/hooks/use-settings";
import { toast } from "sonner";
import type { TeamMember } from "@tms/shared-types";
import { TeamMemberForm } from "./team-member-form";

interface EditTeamMemberDialogProps {
  member: TeamMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTeamMemberDialog({
  member,
  open,
  onOpenChange,
}: EditTeamMemberDialogProps) {
  const updateTeamMember = useUpdateTeamMember();

  const handleSubmit = async (data: {
    firstName: string;
    lastName: string;
    roleIds: string[];
    customerIds?: string[];
  }) => {
    if (!member) return;

    try {
      await updateTeamMember.mutateAsync({
        memberId: member.id,
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          roleIds: data.roleIds,
        },
      });
      toast.success("Team member updated successfully!");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update team member");
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Team Member</DialogTitle>
          <DialogDescription>
            Update team member information and permissions
          </DialogDescription>
        </DialogHeader>
        <TeamMemberForm
          member={member}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={updateTeamMember.isPending}
          submitLabel="Update Member"
          showEmail={false} // Don't show email in edit form
        />
      </DialogContent>
    </Dialog>
  );
}
