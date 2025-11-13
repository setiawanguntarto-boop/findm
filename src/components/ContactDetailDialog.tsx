import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Contact } from "@/pages/Dashboard";
import { Mail, Phone, Building2, MapPin, Calendar, Edit, Trash2, Save, X, Bell } from "lucide-react";
import { contactSchema } from "@/utils/contactSchema";
import { z } from "zod";

interface ContactDetailDialogProps {
  contact: Contact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContactUpdated: () => void;
  onContactDeleted: () => void;
}

const ContactDetailDialog = ({
  contact,
  open,
  onOpenChange,
  onContactUpdated,
  onContactDeleted,
}: ContactDetailDialogProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Contact>>({});
  const { toast } = useToast();

  if (!contact) return null;

  const handleEdit = () => {
    setFormData({
      ...contact,
      tags: contact.tags || [],
      follow_up_date: contact.follow_up_date || "",
      follow_up_notes: contact.follow_up_notes || "",
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const tagsString = (formData as any).tagsInput || "";
      const tagsArray = tagsString
        .split(",")
        .map((tag: string) => tag.trim())
        .filter((tag: string) => tag);

      // Validate input before database operation
      const validatedData = contactSchema.parse({
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        company: formData.company || null,
        title: formData.title || null,
        context_notes: formData.context_notes || null,
        meeting_location: formData.meeting_location || null,
        meeting_date: formData.meeting_date || null,
        follow_up_date: formData.follow_up_date || null,
        follow_up_notes: formData.follow_up_notes || null,
        tags: tagsArray.length > 0 ? tagsArray : null,
      });

      const { error } = await supabase
        .from("contacts")
        .update(validatedData)
        .eq("id", contact.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Contact updated successfully",
      });
      onContactUpdated();
      setIsEditing(false);
    } catch (error: any) {
      let errorMessage = error.message;
      if (error instanceof z.ZodError) {
        errorMessage = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(", ");
      }
      toast({
        title: "Validation Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this contact?")) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("contacts").delete().eq("id", contact.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Contact deleted successfully",
      });
      onContactDeleted();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const initials = contact.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const formatDate = (date?: string) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Contact Details</DialogTitle>
            <div className="flex gap-2">
              {!isEditing ? (
                <>
                  <Button variant="outline" size="sm" onClick={handleEdit}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleDelete} disabled={loading}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={loading}>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        {isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Company</Label>
                <Input
                  value={formData.company || ""}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={formData.title || ""}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Meeting Location</Label>
                <Input
                  value={formData.meeting_location || ""}
                  onChange={(e) => setFormData({ ...formData, meeting_location: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Meeting Date</Label>
                <Input
                  type="date"
                  value={formData.meeting_date || ""}
                  onChange={(e) => setFormData({ ...formData, meeting_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Follow-up Date</Label>
                <Input
                  type="date"
                  value={formData.follow_up_date || ""}
                  onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Tags (comma-separated)</Label>
                <Input
                  value={(formData as any).tagsInput || (formData.tags || []).join(", ")}
                  onChange={(e) =>
                    setFormData({ ...formData, tagsInput: e.target.value } as any)
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Context & Notes</Label>
              <Textarea
                value={formData.context_notes || ""}
                onChange={(e) => setFormData({ ...formData, context_notes: e.target.value })}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Follow-up Notes</Label>
              <Textarea
                value={formData.follow_up_notes || ""}
                onChange={(e) => setFormData({ ...formData, follow_up_notes: e.target.value })}
                rows={3}
                placeholder="What should you discuss or remember during the follow-up?"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              {contact.avatar_url ? (
                <img
                  src={contact.avatar_url}
                  alt={contact.name}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center">
                  <span className="text-accent font-bold text-2xl">{initials}</span>
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-primary">{contact.name}</h2>
                {contact.title && <p className="text-muted-foreground">{contact.title}</p>}
              </div>
            </div>

            <div className="space-y-3">
              {contact.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <a href={`mailto:${contact.email}`} className="text-accent hover:underline">
                    {contact.email}
                  </a>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <a href={`tel:${contact.phone}`} className="text-accent hover:underline">
                    {contact.phone}
                  </a>
                </div>
              )}
              {contact.company && (
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-muted-foreground" />
                  <span>{contact.company}</span>
                </div>
              )}
              {contact.meeting_location && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <span>{contact.meeting_location}</span>
                </div>
              )}
              {contact.meeting_date && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <span>{formatDate(contact.meeting_date)}</span>
                </div>
              )}
              {contact.follow_up_date && (
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <span className="font-medium">Follow-up: {formatDate(contact.follow_up_date)}</span>
                    {contact.follow_up_notes && (
                      <p className="text-sm text-muted-foreground mt-1">{contact.follow_up_notes}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {contact.tags && contact.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {contact.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {contact.context_notes && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                  Context & Memory
                </h3>
                <p className="text-foreground whitespace-pre-wrap">{contact.context_notes}</p>
              </div>
            )}

            <div className="pt-4 border-t border-border text-xs text-muted-foreground">
              Added {new Date(contact.created_at).toLocaleDateString()}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ContactDetailDialog;
