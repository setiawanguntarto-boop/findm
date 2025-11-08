import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ParsedContact } from "@/utils/contactParser";
import { validateContacts, ValidatedContact, getValidationSummary } from "@/utils/contactValidator";
import { contactSchema } from "@/utils/contactSchema";
import { z } from "zod";
import { CheckCircle2, XCircle, Mail, Phone, Building, Briefcase, AlertTriangle, AlertCircle, Trash2, Tag, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  const [contactList, setContactList] = useState<ParsedContact[]>(contacts);
  const [contactTags, setContactTags] = useState<Map<number, string[]>>(new Map());
  const validatedContacts = validateContacts(contactList);
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [newTag, setNewTag] = useState("");
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

  const handleBulkDelete = () => {
    const indicesToDelete = Array.from(selectedContacts);
    const newContactList = contactList.filter((_, index) => !indicesToDelete.includes(index));
    
    setContactList(newContactList);
    setSelectedContacts(new Set());
    setShowDeleteDialog(false);
    
    toast({
      title: "Removed",
      description: `Removed ${indicesToDelete.length} contact${indicesToDelete.length !== 1 ? 's' : ''} from import list`,
    });

    // If no contacts left, close the dialog
    if (newContactList.length === 0) {
      onOpenChange(false);
    }
  };

  const handleBulkTag = () => {
    if (!newTag.trim()) return;

    const newTagsMap = new Map(contactTags);
    selectedContacts.forEach(index => {
      const existingTags = newTagsMap.get(index) || [];
      if (!existingTags.includes(newTag.trim())) {
        newTagsMap.set(index, [...existingTags, newTag.trim()]);
      }
    });

    setContactTags(newTagsMap);
    setNewTag("");
    setShowTagDialog(false);
    
    toast({
      title: "Tag Added",
      description: `Added tag "${newTag.trim()}" to ${selectedContacts.size} contact${selectedContacts.size !== 1 ? 's' : ''}`,
    });
  };

  const handleProceedToConfirm = () => {
    setShowConfirmation(true);
  };

  const handleConfirmImport = async () => {
    if (!user || selectedContacts.size === 0) return;

    setImporting(true);
    try {
      // Validate and prepare contacts for import
      const contactsToImport = validatedContacts
        .filter((_, index) => selectedContacts.has(index))
        .map((contact, arrayIndex) => {
          // Find the original index in validatedContacts
          const originalIndex = validatedContacts.indexOf(contact);
          const tags = contactTags.get(originalIndex) || null;
          
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
            tags: tags,
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
      setShowConfirmation(false);
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

  const selectedContactsData = validatedContacts.filter((_, index) => selectedContacts.has(index));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {showConfirmation ? 'Confirm Import' : 'Import Contacts Preview'}
          </DialogTitle>
          <DialogDescription>
            {showConfirmation 
              ? `You are about to import ${selectedContacts.size} contact${selectedContacts.size > 1 ? 's' : ''}. Please review and confirm.`
              : `Review and select contacts to import. ${validationSummary.total} contact${validationSummary.total > 1 ? 's' : ''} found.`
            }
          </DialogDescription>
        </DialogHeader>

        {/* Confirmation View */}
        {showConfirmation ? (
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  The following {selectedContactsData.length} contact{selectedContactsData.length > 1 ? 's' : ''} will be added to your contact list.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                {selectedContactsData.map((contact, idx) => {
                  const originalIndex = validatedContacts.indexOf(contact);
                  const tags = contactTags.get(originalIndex);
                  
                  return (
                    <div key={idx} className="border rounded-lg p-4 bg-card">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-foreground">{contact.name}</h4>
                          {contact.validation.isValid ? (
                            <Badge variant="outline" className="mt-1">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Valid
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="mt-1">
                              <XCircle className="w-3 h-3 mr-1" />
                              Has Issues
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
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
                        {tags && tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </ScrollArea>
        ) : (
          <>
            {/* Bulk Actions Toolbar */}
            {selectedContacts.size > 0 && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-medium text-sm text-foreground">
                {selectedContacts.size} selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedContacts(new Set())}
                className="h-7"
              >
                <X className="w-3 h-3 mr-1" />
                Clear
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTagDialog(true)}
                className="h-7"
              >
                <Tag className="w-3 h-3 mr-1" />
                Add Tag
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                className="h-7"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Remove
              </Button>
            </div>
          </div>
        )}

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
                        {/* Show tags if any */}
                        {contactTags.get(originalIndex) && contactTags.get(originalIndex)!.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {contactTags.get(originalIndex)!.map((tag, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
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
          </>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t">
          {showConfirmation ? (
            <>
              <Button 
                variant="outline" 
                onClick={() => setShowConfirmation(false)} 
                disabled={importing}
              >
                Back
              </Button>
              <Button 
                onClick={handleConfirmImport} 
                disabled={importing}
              >
                {importing ? "Importing..." : `Confirm & Import ${selectedContacts.size} Contact${selectedContacts.size > 1 ? 's' : ''}`}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={importing}>
                Cancel
              </Button>
              <Button onClick={handleProceedToConfirm} disabled={importing || selectedContacts.size === 0}>
                Review & Confirm
              </Button>
            </>
          )}
        </div>
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {selectedContacts.size} contact{selectedContacts.size !== 1 ? 's' : ''}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the selected contact{selectedContacts.size !== 1 ? 's' : ''} from the import list. They will not be imported.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Tag Dialog */}
      <AlertDialog open={showTagDialog} onOpenChange={setShowTagDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add Tag to {selectedContacts.size} contact{selectedContacts.size !== 1 ? 's' : ''}</AlertDialogTitle>
            <AlertDialogDescription>
              Enter a tag to add to the selected contacts. The tag will be applied when you import these contacts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              placeholder="Enter tag name..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleBulkTag();
                }
              }}
              autoFocus
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setNewTag("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkTag}
              disabled={!newTag.trim()}
            >
              Add Tag
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};

export default ImportPreviewDialog;
