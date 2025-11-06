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
import { validateContacts, ValidatedContact, getValidationSummary } from "@/utils/contactValidator";
import { contactSchema } from "@/utils/contactSchema";
import { z } from "zod";
import { CheckCircle2, XCircle, Mail, Phone, Building, Briefcase, AlertTriangle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ImportPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contacts: ParsedContact[];
  onImportComplete: () => void;
}

const ImportPreviewDialog = ({ open, onOpenChange, contacts, onImportComplete }: ImportPreviewDialogProps) => {
  // Validate all contacts
  const validatedContacts = validateContacts(contacts);
  const validationSummary = getValidationSummary(validatedContacts);

  const [selectedContacts, setSelectedContacts] = useState<Set<number>>(() => {
    // Only select valid contacts by default
    return new Set(
      validatedContacts
        .map((_, i) => i)
        .filter(i => validatedContacts[i].validation.isValid)
    );
  });
  const [importing, setImporting] = useState(false);
  const [showInvalidOnly, setShowInvalidOnly] = useState(false);
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
    if (selectedContacts.size === validatedContacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(validatedContacts.map((_, i) => i)));
    }
  };

  const selectOnlyValid = () => {
    setSelectedContacts(
      new Set(
        validatedContacts
          .map((_, i) => i)
          .filter(i => validatedContacts[i].validation.isValid)
      )
    );
  };

  const handleImport = async () => {
    if (!user || selectedContacts.size === 0) return;

    setImporting(true);
    try {
      // Validate and prepare contacts for import
      const contactsToImport = validatedContacts
        .filter((_, index) => selectedContacts.has(index))
        .map(contact => {
          // Validate each contact before import
          const validatedData = contactSchema.parse({
            name: contact.name,
            email: contact.email || null,
            phone: contact.phone || null,
            company: contact.company || null,
            title: contact.title || null,
            context_notes: contact.notes || null,
            meeting_location: null,
            meeting_date: null,
            tags: null,
          });

          return {
            user_id: user.id,
            name: validatedData.name,
            email: validatedData.email,
            phone: validatedData.phone,
            company: validatedData.company,
            title: validatedData.title,
            tags: validatedData.tags,
            context_notes: validatedData.context_notes,
            meeting_location: validatedData.meeting_location,
            meeting_date: validatedData.meeting_date,
            source: "import",
          };
        });

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
      let errorMessage = error.message || "Failed to import contacts";
      if (error instanceof z.ZodError) {
        errorMessage = "Validation failed: " + error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(", ");
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const displayedContacts = showInvalidOnly 
    ? validatedContacts.filter(c => !c.validation.isValid)
    : validatedContacts;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Contacts Preview</DialogTitle>
          <DialogDescription>
            Review and select contacts to import. {validationSummary.total} contact{validationSummary.total > 1 ? 's' : ''} found.
          </DialogDescription>
        </DialogHeader>

        {/* Validation Summary */}
        {validationSummary.invalid > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {validationSummary.invalid} contact{validationSummary.invalid > 1 ? 's have' : ' has'} validation errors and cannot be imported.
            </AlertDescription>
          </Alert>
        )}

        {validationSummary.withWarnings > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {validationSummary.withWarnings} contact{validationSummary.withWarnings > 1 ? 's have' : ' has'} warnings. You can still import them, but you may want to review the data.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between p-4 bg-muted rounded-lg gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={selectedContacts.size === validatedContacts.length}
              onCheckedChange={toggleAll}
              id="select-all"
            />
            <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
              Select All ({selectedContacts.size}/{validatedContacts.length})
            </label>
            {validationSummary.invalid > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={selectOnlyValid}
              >
                Select Valid Only
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
              {validationSummary.valid} Valid
            </Badge>
            {validationSummary.invalid > 0 && (
              <Badge variant="destructive">
                {validationSummary.invalid} Invalid
              </Badge>
            )}
            {validationSummary.withWarnings > 0 && (
              <Badge variant="outline" className="border-yellow-500 text-yellow-700 dark:text-yellow-400">
                {validationSummary.withWarnings} Warnings
              </Badge>
            )}
            {validationSummary.invalid > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInvalidOnly(!showInvalidOnly)}
              >
                {showInvalidOnly ? "Show All" : "Show Invalid Only"}
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-3">
            {displayedContacts.map((contact, index) => {
              const originalIndex = showInvalidOnly 
                ? validatedContacts.indexOf(contact)
                : index;
              const validation = contact.validation;
              const isSelected = selectedContacts.has(originalIndex);

              return (
                <TooltipProvider key={originalIndex}>
                  <div
                    className={`p-4 border rounded-lg transition-all ${
                      !validation.isValid
                        ? 'border-destructive bg-destructive/5'
                        : isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleContact(originalIndex)}
                        disabled={!validation.isValid}
                        id={`contact-${originalIndex}`}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-foreground">{contact.name}</h4>
                          {!validation.isValid ? (
                            <Tooltip>
                              <TooltipTrigger>
                                <XCircle className="w-4 h-4 text-destructive" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-semibold mb-1">Cannot Import</p>
                                {validation.issues
                                  .filter(i => i.severity === 'error')
                                  .map((issue, i) => (
                                    <p key={i} className="text-xs">• {issue.issue}</p>
                                  ))}
                              </TooltipContent>
                            </Tooltip>
                          ) : validation.hasWarnings ? (
                            <Tooltip>
                              <TooltipTrigger>
                                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-semibold mb-1">Warnings</p>
                                {validation.issues
                                  .filter(i => i.severity === 'warning')
                                  .map((issue, i) => (
                                    <p key={i} className="text-xs">• {issue.issue}</p>
                                  ))}
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          {contact.email && (
                            <div className={`flex items-center gap-2 ${
                              validation.issues.some(i => i.field === 'email' && i.severity === 'error')
                                ? 'text-destructive'
                                : 'text-muted-foreground'
                            }`}>
                              <Mail className="w-4 h-4" />
                              {contact.email}
                            </div>
                          )}
                          {contact.phone && (
                            <div className={`flex items-center gap-2 ${
                              validation.issues.some(i => i.field === 'phone' && i.severity === 'error')
                                ? 'text-destructive'
                                : 'text-muted-foreground'
                            }`}>
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
                        {/* Show validation issues */}
                        {validation.issues.length > 0 && (
                          <div className="mt-3 space-y-1">
                            {validation.issues.map((issue, i) => (
                              <div
                                key={i}
                                className={`text-xs px-2 py-1 rounded ${
                                  issue.severity === 'error'
                                    ? 'bg-destructive/10 text-destructive'
                                    : 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                                }`}
                              >
                                <span className="font-semibold">{issue.field}:</span> {issue.issue}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TooltipProvider>
              );
            })}
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
