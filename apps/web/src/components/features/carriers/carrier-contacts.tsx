"use client";

import { useState } from "react";
import {
  useCarrierContacts,
  useAddCarrierContact,
  useDeleteCarrierContact,
} from "@/hooks/use-carriers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Users, Plus, Mail, Phone, Trash2, Loader2 } from "lucide-react";
import type { CreateCarrierContactInput } from "@/types/carrier.types";
import { CanCreate, CanDelete } from "@/components/auth/can";

interface CarrierContactsProps {
  carrierId: string;
}

export function CarrierContacts({ carrierId }: CarrierContactsProps) {
  const { data: contacts, isLoading } = useCarrierContacts(carrierId);
  const addContact = useAddCarrierContact();
  const deleteContact = useDeleteCarrierContact();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteContactId, setDeleteContactId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateCarrierContactInput>({
    name: "",
    email: "",
    phone: "",
    title: "",
    isPrimary: false,
  });

  const handleAdd = async () => {
    await addContact.mutateAsync({
      carrierId,
      data: formData,
    });

    setAddDialogOpen(false);
    setFormData({
      name: "",
      email: "",
      phone: "",
      title: "",
      isPrimary: false,
    });
  };

  const handleDelete = async () => {
    if (!deleteContactId) return;

    await deleteContact.mutateAsync({
      carrierId,
      contactId: deleteContactId,
    });

    setDeleteContactId(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Contacts
            </CardTitle>
            <CanCreate resource="carrier">
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Contact
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Contact</DialogTitle>
                    <DialogDescription>
                      Add a new contact for this carrier
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Name *</Label>
                      <Input
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        placeholder="john@carrier.com"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Phone *</Label>
                      <Input
                        placeholder="(555) 123-4567"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input
                        placeholder="Dispatcher, Manager, etc."
                        value={formData.title || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isPrimary"
                        checked={formData.isPrimary}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            isPrimary: checked as boolean,
                          })
                        }
                      />
                      <Label
                        htmlFor="isPrimary"
                        className="text-sm font-normal cursor-pointer"
                      >
                        Set as primary contact
                      </Label>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setAddDialogOpen(false)}
                      disabled={addContact.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAdd}
                      disabled={
                        addContact.isPending ||
                        !formData.name ||
                        !formData.email ||
                        !formData.phone
                      }
                    >
                      {addContact.isPending ? "Adding..." : "Add Contact"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CanCreate>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !contacts || contacts.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                No contacts added yet
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-start justify-between p-3 border rounded-lg"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{contact.name}</p>
                      {contact.isPrimary && (
                        <Badge variant="default" className="h-5 text-xs">
                          Primary
                        </Badge>
                      )}
                    </div>
                    {contact.title && (
                      <p className="text-xs text-muted-foreground">
                        {contact.title}
                      </p>
                    )}
                    <div className="flex flex-col gap-1 text-sm">
                      <a
                        href={`mailto:${contact.email}`}
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        <Mail className="h-3 w-3" />
                        {contact.email}
                      </a>
                      <a
                        href={`tel:${contact.phone}`}
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        <Phone className="h-3 w-3" />
                        {contact.phone}
                      </a>
                    </div>
                  </div>
                  <CanDelete resource="carrier">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => setDeleteContactId(contact.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CanDelete>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteContactId}
        onOpenChange={() => setDeleteContactId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this contact? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} variant="destructive">
              {deleteContact.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
