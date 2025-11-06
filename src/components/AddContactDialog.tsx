import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { contactSchema } from "@/utils/contactSchema";
import { z } from "zod";

interface AddContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContactAdded: () => void;
  initialData?: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    title?: string;
  };
}

const AddContactDialog = ({ open, onOpenChange, onContactAdded, initialData }: AddContactDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    company: initialData?.company || "",
    title: initialData?.title || "",
    tags: "",
    context_notes: "",
    meeting_location: "",
    meeting_date: "",
  });
  const { toast } = useToast();
  const { user } = useAuth();

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        name: initialData.name || prev.name,
        email: initialData.email || prev.email,
        phone: initialData.phone || prev.phone,
        company: initialData.company || prev.company,
        title: initialData.title || prev.title,
      }));
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const tagsArray = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag);

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
        tags: tagsArray.length > 0 ? tagsArray : null,
      });

      const { error } = await supabase.from("contacts").insert({
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
        source: "manual",
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Contact added successfully",
      });

      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        title: "",
        tags: "",
        context_notes: "",
        meeting_location: "",
        meeting_date: "",
      });
      onContactAdded();
      onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Contact</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meeting_location">Meeting Location</Label>
              <Input
                id="meeting_location"
                value={formData.meeting_location}
                onChange={(e) => setFormData({ ...formData, meeting_location: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meeting_date">Meeting Date</Label>
              <Input
                id="meeting_date"
                type="date"
                value={formData.meeting_date}
                onChange={(e) => setFormData({ ...formData, meeting_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                placeholder="conference, lead, friend"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="context_notes">Context & Notes</Label>
            <Textarea
              id="context_notes"
              placeholder="Add any relevant context, conversation notes, or memories..."
              value={formData.context_notes}
              onChange={(e) => setFormData({ ...formData, context_notes: e.target.value })}
              rows={4}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Contact"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddContactDialog;
