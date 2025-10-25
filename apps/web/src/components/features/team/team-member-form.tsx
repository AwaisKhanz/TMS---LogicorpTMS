"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  MultiSelect,
  type MultiSelectOption,
} from "@/components/ui/multi-select";
import { useCustomerOptions } from "@/hooks/use-customers";
import type { TeamMember } from "@tms/shared-types";

const teamMemberSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email").optional(),
  roleIds: z.array(z.string()).min(1, "At least one role must be selected"),
  customerIds: z.array(z.string()).optional(),
});

const roles: MultiSelectOption[] = [
  {
    value: "administrator",
    label: "Administrator",
    description: "Full access to all features",
  },
  {
    value: "manager",
    label: "Manager",
    description: "Manage loads and carriers, see assigned customers",
  },
  {
    value: "dispatcher",
    label: "Dispatcher",
    description: "Create and manage loads, see assigned customers",
  },
  {
    value: "viewer",
    label: "Viewer",
    description: "View-only access",
  },
  {
    value: "invoices",
    label: "Invoices (Accounting)",
    description: "Manage invoices and billing",
  },
];

interface TeamMemberFormProps {
  member?: TeamMember | null;
  onSubmit: (data: z.infer<typeof teamMemberSchema>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  submitLabel?: string;
  showEmail?: boolean;
}

export function TeamMemberForm({
  member,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = "Save",
  showEmail = true,
}: TeamMemberFormProps) {
  const { customers: customerOptions = [] } = useCustomerOptions();

  const form = useForm<z.infer<typeof teamMemberSchema>>({
    resolver: zodResolver(teamMemberSchema),
    defaultValues: {
      firstName: member?.firstName || "",
      lastName: member?.lastName || "",
      email: member?.email || "",
      roleIds: member?.roles || [],
      customerIds: member?.assignedCustomers?.map((c) => c.id) || [],
    },
  });

  // Update form when member changes
  React.useEffect(() => {
    if (member) {
      form.reset({
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        roleIds: member.roles,
        customerIds: member.assignedCustomers?.map((c) => c.id) || [],
      });
    }
  }, [member, form]);

  const handleSubmit = async (data: z.infer<typeof teamMemberSchema>) => {
    try {
      await onSubmit(data);
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  const customerSelectOptions: MultiSelectOption[] = customerOptions.map(
    (customer) => ({
      value: customer.id,
      label: customer.label,
      description: customer.value,
    })
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {showEmail && (
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input {...field} type="email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="roleIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Roles</FormLabel>
              <FormControl>
                <MultiSelect
                  options={roles}
                  selected={field.value}
                  onChange={field.onChange}
                  placeholder="Select roles..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="customerIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assign Customers (Optional)</FormLabel>
              <FormControl>
                <MultiSelect
                  options={customerSelectOptions}
                  selected={field.value || []}
                  onChange={field.onChange}
                  placeholder="Select customers..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
