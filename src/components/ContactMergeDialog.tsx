import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Contact } from "@/pages/Dashboard";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";

interface ContactMergeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contacts: Contact[];
  onMerge: (mergedContact: Partial<Contact>, contactIdsToDelete: string[]) => void;
}

export function ContactMergeDialog({
  open,
  onOpenChange,
  contacts,
  onMerge,
}: ContactMergeDialogProps) {
  const [selectedValues, setSelectedValues] = useState<Record<string, string>>({});

  const handleMerge = () => {
    if (contacts.length < 2) return;

    // Build the merged contact
    const mergedContact: Partial<Contact> = {
      name: getSelectedValue("name"),
      email: getSelectedValue("email") || undefined,
      phone: getSelectedValue("phone") || undefined,
      company: getSelectedValue("company") || undefined,
      title: getSelectedValue("title") || undefined,
      meeting_location: getSelectedValue("meeting_location") || undefined,
      meeting_date: getSelectedValue("meeting_date") || undefined,
      avatar_url: getSelectedValue("avatar_url") || undefined,
      // Combine all tags from all contacts (unique)
      tags: Array.from(
        new Set(contacts.flatMap((c) => c.tags || []))
      ).sort(),
      // Combine all context notes with separator
      context_notes: contacts
        .map((c) => c.context_notes)
        .filter(Boolean)
        .join("\n\n---\n\n"),
    };

    // The first contact will be updated, others will be deleted
    const contactIdsToDelete = contacts.slice(1).map((c) => c.id);

    onMerge(mergedContact, contactIdsToDelete);
  };

  const getSelectedValue = (field: string): string => {
    const selectedId = selectedValues[field];
    if (!selectedId) {
      // Default to first contact with a value
      const contactWithValue = contacts.find(
        (c) => c[field as keyof Contact]
      );
      return contactWithValue?.[field as keyof Contact] as string || "";
    }
    const contact = contacts.find((c) => c.id === selectedId);
    return (contact?.[field as keyof Contact] as string) || "";
  };

  const handleFieldSelection = (field: string, contactId: string) => {
    setSelectedValues((prev) => ({ ...prev, [field]: contactId }));
  };

  const getFieldOptions = (field: keyof Contact) => {
    return contacts
      .map((contact) => ({
        contactId: contact.id,
        value: contact[field],
        contactName: contact.name,
      }))
      .filter((option) => option.value); // Only show non-empty values
  };

  const renderFieldSelector = (
    field: keyof Contact,
    label: string,
    formatValue?: (value: any) => string
  ) => {
    const options = getFieldOptions(field);
    if (options.length === 0) return null;

    return (
      <div className="space-y-2">
        <Label className="text-sm font-semibold">{label}</Label>
        <RadioGroup
          value={selectedValues[field] || options[0].contactId}
          onValueChange={(value) => handleFieldSelection(field, value)}
        >
          {options.map((option) => (
            <div key={option.contactId} className="flex items-center space-x-2">
              <RadioGroupItem value={option.contactId} id={`${field}-${option.contactId}`} />
              <Label
                htmlFor={`${field}-${option.contactId}`}
                className="text-sm font-normal cursor-pointer flex-1"
              >
                {formatValue ? formatValue(option.value) : (option.value as string)}
                <span className="text-xs text-muted-foreground ml-2">
                  (from {option.contactName})
                </span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Merge Contacts</DialogTitle>
          <DialogDescription>
            Select which values to keep for each field. Tags and notes will be combined from all contacts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Preview of contacts being merged */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">Merging Contacts:</Label>
            <div className="flex flex-wrap gap-2">
              {contacts.map((contact) => (
                <Badge key={contact.id} variant="secondary">
                  {contact.name}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Field selectors */}
          {renderFieldSelector("name", "Name *")}
          {renderFieldSelector("email", "Email")}
          {renderFieldSelector("phone", "Phone")}
          {renderFieldSelector("company", "Company")}
          {renderFieldSelector("title", "Job Title")}
          {renderFieldSelector("meeting_location", "Meeting Location")}
          {renderFieldSelector("meeting_date", "Meeting Date", (value) =>
            value ? format(new Date(value), "MMM d, yyyy") : ""
          )}

          <Separator />

          {/* Auto-merged fields preview */}
          <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
            <Label className="text-sm font-semibold">Automatically Combined:</Label>
            
            {/* Tags preview */}
            {contacts.some((c) => c.tags && c.tags.length > 0) && (
              <div>
                <Label className="text-xs text-muted-foreground">Tags</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {Array.from(new Set(contacts.flatMap((c) => c.tags || []))).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Context notes preview */}
            {contacts.some((c) => c.context_notes) && (
              <div>
                <Label className="text-xs text-muted-foreground">Context Notes</Label>
                <p className="text-sm text-foreground mt-1 whitespace-pre-wrap max-h-32 overflow-y-auto">
                  {contacts
                    .map((c) => c.context_notes)
                    .filter(Boolean)
                    .join("\n\n---\n\n")}
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleMerge}>
            Merge {contacts.length} Contacts
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
