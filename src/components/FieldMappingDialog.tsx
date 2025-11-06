import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export interface FieldMapping {
  [csvColumn: string]: string; // maps CSV column to contact field
}

interface FieldMappingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  csvHeaders: string[];
  sampleData: string[][];
  onMappingComplete: (mapping: FieldMapping) => void;
}

const CONTACT_FIELDS = [
  { value: "name", label: "Name", required: true },
  { value: "email", label: "Email", required: false },
  { value: "phone", label: "Phone", required: false },
  { value: "company", label: "Company", required: false },
  { value: "title", label: "Title", required: false },
  { value: "notes", label: "Notes", required: false },
  { value: "ignore", label: "Ignore this column", required: false },
];

const FieldMappingDialog = ({
  open,
  onOpenChange,
  csvHeaders,
  sampleData,
  onMappingComplete,
}: FieldMappingDialogProps) => {
  // Initialize mapping with auto-detected values
  const [mapping, setMapping] = useState<FieldMapping>(() => {
    const initialMapping: FieldMapping = {};
    csvHeaders.forEach((header) => {
      const lowerHeader = header.toLowerCase();
      
      // Auto-detect based on common patterns
      if (lowerHeader.includes('name') && !lowerHeader.includes('first') && !lowerHeader.includes('last')) {
        initialMapping[header] = 'name';
      } else if (lowerHeader.includes('first') && lowerHeader.includes('name')) {
        initialMapping[header] = 'name';
      } else if (lowerHeader.includes('email') || lowerHeader.includes('e-mail')) {
        initialMapping[header] = 'email';
      } else if (lowerHeader.includes('phone') || lowerHeader.includes('mobile') || lowerHeader.includes('tel')) {
        initialMapping[header] = 'phone';
      } else if (lowerHeader.includes('company') || lowerHeader.includes('organization')) {
        initialMapping[header] = 'company';
      } else if (lowerHeader.includes('title') || lowerHeader.includes('job') || lowerHeader.includes('position')) {
        initialMapping[header] = 'title';
      } else if (lowerHeader.includes('note') || lowerHeader.includes('comment')) {
        initialMapping[header] = 'notes';
      } else {
        initialMapping[header] = 'ignore';
      }
    });
    return initialMapping;
  });

  const updateMapping = (csvColumn: string, contactField: string) => {
    setMapping((prev) => ({
      ...prev,
      [csvColumn]: contactField,
    }));
  };

  const hasNameField = Object.values(mapping).includes('name');

  const handleContinue = () => {
    if (!hasNameField) return;
    onMappingComplete(mapping);
  };

  // Get sample values for a column
  const getSampleValues = (columnIndex: number): string[] => {
    return sampleData
      .slice(0, 3)
      .map(row => row[columnIndex])
      .filter(val => val && val.trim());
  };

  // Check if a field is already mapped
  const isFieldMapped = (field: string, currentColumn: string): boolean => {
    return Object.entries(mapping).some(
      ([col, val]) => col !== currentColumn && val === field && field !== 'ignore'
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Map CSV Columns</DialogTitle>
          <DialogDescription>
            Map your CSV columns to contact fields. At least one column must be mapped to "Name".
          </DialogDescription>
        </DialogHeader>

        {!hasNameField && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You must map at least one column to the "Name" field to continue.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Badge variant="secondary">{csvHeaders.length} columns found</Badge>
          <span>•</span>
          <span>{sampleData.length} sample rows</span>
        </div>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {csvHeaders.map((header, index) => {
              const sampleValues = getSampleValues(index);
              const currentMapping = mapping[header];

              return (
                <div
                  key={index}
                  className="p-4 border rounded-lg bg-card space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <Label className="text-sm font-semibold text-foreground">
                        {header}
                      </Label>
                      {sampleValues.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Examples: {sampleValues.join(', ')}
                        </div>
                      )}
                    </div>

                    <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />

                    <div className="w-48">
                      <Select
                        value={currentMapping}
                        onValueChange={(value) => updateMapping(header, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          {CONTACT_FIELDS.map((field) => {
                            const alreadyMapped = isFieldMapped(field.value, header);
                            
                            return (
                              <SelectItem
                                key={field.value}
                                value={field.value}
                                disabled={alreadyMapped}
                              >
                                <div className="flex items-center justify-between w-full">
                                  <span>{field.label}</span>
                                  {field.required && (
                                    <Badge variant="outline" className="ml-2 text-xs">
                                      Required
                                    </Badge>
                                  )}
                                  {alreadyMapped && (
                                    <Badge variant="secondary" className="ml-2 text-xs">
                                      Mapped
                                    </Badge>
                                  )}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {currentMapping === 'ignore' && (
                    <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      This column will be ignored during import
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {Object.values(mapping).filter(v => v !== 'ignore').length} of {csvHeaders.length} columns mapped
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleContinue} disabled={!hasNameField}>
              Continue to Preview
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FieldMappingDialog;
