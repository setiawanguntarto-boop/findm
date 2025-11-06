import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle2, AlertTriangle, Mail, Phone, Building, Briefcase, MapPin, Calendar, Tag } from "lucide-react";

interface ContactData {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  meeting_location?: string;
  meeting_date?: string;
  tags?: string[];
  context_notes?: string;
}

interface ContactConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactData: ContactData;
  onConfirm: () => void;
  onEdit: () => void;
  title?: string;
  description?: string;
}

const ContactConfirmationDialog = ({
  open,
  onOpenChange,
  contactData,
  onConfirm,
  onEdit,
  title = "Confirm Contact Information",
  description = "Please review the extracted contact information before adding to your contacts.",
}: ContactConfirmationDialogProps) => {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setIsConfirming(false);
    }
  };

  // Check completeness
  const hasEmail = !!contactData.email;
  const hasPhone = !!contactData.phone;
  const hasCompany = !!contactData.company;
  const completeness = [hasEmail, hasPhone, hasCompany].filter(Boolean).length;
  const isComplete = completeness >= 2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isComplete ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            )}
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Completeness Badge */}
          <div className="flex items-center gap-2">
            <Badge
              variant={isComplete ? "default" : "outline"}
              className={
                isComplete
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                  : "border-yellow-500 text-yellow-700 dark:text-yellow-400"
              }
            >
              {isComplete ? "Information Complete" : "Some Information Missing"}
            </Badge>
            {!isComplete && (
              <span className="text-xs text-muted-foreground">
                Consider adding more details for better organization
              </span>
            )}
          </div>

          {/* Contact Information Table */}
          <Card className="border-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Field</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      Name
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">{contactData.name}</TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {hasEmail ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      )}
                      <Mail className="w-4 h-4" />
                      Email
                    </div>
                  </TableCell>
                  <TableCell>
                    {contactData.email || (
                      <span className="text-muted-foreground italic">Not provided</span>
                    )}
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {hasPhone ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      )}
                      <Phone className="w-4 h-4" />
                      Phone
                    </div>
                  </TableCell>
                  <TableCell>
                    {contactData.phone || (
                      <span className="text-muted-foreground italic">Not provided</span>
                    )}
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {hasCompany ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      )}
                      <Building className="w-4 h-4" />
                      Company
                    </div>
                  </TableCell>
                  <TableCell>
                    {contactData.company || (
                      <span className="text-muted-foreground italic">Not provided</span>
                    )}
                  </TableCell>
                </TableRow>

                {(contactData.title || true) && (
                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        Title
                      </div>
                    </TableCell>
                    <TableCell>
                      {contactData.title || (
                        <span className="text-muted-foreground italic">Not provided</span>
                      )}
                    </TableCell>
                  </TableRow>
                )}

                {(contactData.meeting_location || true) && (
                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Meeting Location
                      </div>
                    </TableCell>
                    <TableCell>
                      {contactData.meeting_location || (
                        <span className="text-muted-foreground italic">Not provided</span>
                      )}
                    </TableCell>
                  </TableRow>
                )}

                {(contactData.meeting_date || true) && (
                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Meeting Date
                      </div>
                    </TableCell>
                    <TableCell>
                      {contactData.meeting_date || (
                        <span className="text-muted-foreground italic">Not provided</span>
                      )}
                    </TableCell>
                  </TableRow>
                )}

                {(contactData.tags?.length || true) && (
                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4" />
                        Tags
                      </div>
                    </TableCell>
                    <TableCell>
                      {contactData.tags && contactData.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {contactData.tags.map((tag, idx) => (
                            <Badge key={idx} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">No tags</span>
                      )}
                    </TableCell>
                  </TableRow>
                )}

                {contactData.context_notes && (
                  <TableRow>
                    <TableCell className="font-medium align-top pt-4">Notes</TableCell>
                    <TableCell className="pt-4">
                      <p className="text-sm whitespace-pre-wrap">{contactData.context_notes}</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onEdit} disabled={isConfirming}>
            Edit Information
          </Button>
          <Button onClick={handleConfirm} disabled={isConfirming}>
            {isConfirming ? "Adding..." : "Confirm & Add Contact"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ContactConfirmationDialog;
