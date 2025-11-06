import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ParsedContact } from "@/utils/contactParser";
import { CheckCircle2, XCircle, Mail, Phone, Building, Briefcase } from "lucide-react";

interface ImportPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contacts: ParsedContact[];
  onImportComplete: () => void;
}

const ImportPreviewDialog = ({ open, onOpenChange, contacts, onImportComplete }: ImportPreviewDialogProps) => {
  const [selectedContacts, setSelectedContacts] = useState<Set<number>>(
    new Set(contacts.map((_, i) => i))
  );
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const toggleContact = (index: number) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedContacts(newSelected);
  };

  const toggleAll = () => {
    if (selectedContacts.size === contacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(contacts.map((_, i) => i)));
    }
  };

  const handleImport = async () => {
    if (!user || selectedContacts.size === 0) return;

    setImporting(true);
    try {
      const contactsToImport = contacts
        .filter((_, index) => selectedContacts.has(index))
        .map(contact => ({
          user_id: user.id,
          name: contact.name,
          email: contact.email || null,
          phone: contact.phone || null,
          company: contact.company || null,
          title: contact.title || null,
          context_notes: contact.notes || null,
          source: "import",
        }));

      const { error } = await supabase.from("contacts").insert(contactsToImport);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${selectedContacts.size} contact${selectedContacts.size > 1 ? 's' : ''} imported successfully`,
      });

      onImportComplete();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to import contacts",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Contacts Preview</DialogTitle>
          <DialogDescription>
            Review and select contacts to import. {contacts.length} contact{contacts.length > 1 ? 's' : ''} found.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={selectedContacts.size === contacts.length}
              onCheckedChange={toggleAll}
              id="select-all"
            />
            <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
              Select All ({selectedContacts.size}/{contacts.length})
            </label>
          </div>
          <Badge variant="secondary">
            {selectedContacts.size} selected
          </Badge>
        </div>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-3">
            {contacts.map((contact, index) => (
              <div
                key={index}
                className={`p-4 border rounded-lg transition-all ${
                  selectedContacts.has(index)
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedContacts.has(index)}
                    onCheckedChange={() => toggleContact(index)}
                    id={`contact-${index}`}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-foreground">{contact.name}</h4>
                      {selectedContacts.has(index) ? (
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      ) : (
                        <XCircle className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      {contact.email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="w-4 h-4" />
                          {contact.email}
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="w-4 h-4" />
                          {contact.phone}
                        </div>
                      )}
                      {contact.company && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Building className="w-4 h-4" />
                          {contact.company}
                        </div>
                      )}
                      {contact.title && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Briefcase className="w-4 h-4" />
                          {contact.title}
                        </div>
                      )}
                    </div>
                    {contact.notes && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        {contact.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={importing}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={importing || selectedContacts.size === 0}>
            {importing ? "Importing..." : `Import ${selectedContacts.size} Contact${selectedContacts.size > 1 ? 's' : ''}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportPreviewDialog;
