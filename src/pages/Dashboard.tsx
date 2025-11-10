import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, LogOut, User as UserIcon, Camera, Upload, CheckCircle2, Download } from "lucide-react";
import ContactCard from "@/components/ContactCard";
import AddContactDialog from "@/components/AddContactDialog";
import ContactDetailDialog from "@/components/ContactDetailDialog";
import ContactConfirmationDialog from "@/components/ContactConfirmationDialog";
import ImportPreviewDialog from "@/components/ImportPreviewDialog";
import FieldMappingDialog, { FieldMapping } from "@/components/FieldMappingDialog";
import { BulkActionsToolbar } from "@/components/BulkActionsToolbar";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { contactSchema } from "@/utils/contactSchema";
import logoFull from "@/assets/logo-new.png";
import { useNavigate, Link } from "react-router-dom";
import { parseContactFile, ParsedContact, needsManualMapping, getCSVHeaders } from "@/utils/contactParser";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  tags?: string[];
  context_notes?: string;
  meeting_location?: string;
  meeting_date?: string;
  source?: string;
  avatar_url?: string;
  created_at: string;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [cardFile, setCardFile] = useState<File | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [parsedContacts, setParsedContacts] = useState<ParsedContact[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImportPreviewOpen, setIsImportPreviewOpen] = useState(false);
  const [isFieldMappingOpen, setIsFieldMappingOpen] = useState(false);
  const [csvHeaders, setCSVHeaders] = useState<string[]>([]);
  const [csvSampleData, setCSVSampleData] = useState<string[][]>([]);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const cardInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setContacts(data || []);
      setFilteredContacts(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load contacts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    let filtered = contacts;

    if (searchQuery) {
      filtered = filtered.filter(
        (contact) =>
          contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.context_notes?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedTag) {
      filtered = filtered.filter((contact) =>
        contact.tags?.includes(selectedTag)
      );
    }

    setFilteredContacts(filtered);
  }, [searchQuery, selectedTag, contacts]);

  const allTags = Array.from(
    new Set(contacts.flatMap((c) => c.tags || []))
  ).sort();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleCardUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log('📤 Starting business card upload:', file.name, file.size, file.type);
    setCardFile(file);
    setIsProcessing(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onloadend = async () => {
        try {
          const base64data = reader.result as string;
          console.log('📄 File converted to base64, length:', base64data.length);
          
          toast({
            title: "Processing...",
            description: "Extracting contact information from business card...",
          });

          console.log('🔄 Getting auth session...');
          
          // Get the current session for authentication
          const { data: { session } } = await supabase.auth.getSession();
          
          if (!session) {
            console.error('❌ No active session found');
            throw new Error('Please log in to use this feature');
          }
          
          console.log('✅ Session found, calling extract-business-card edge function...');
          
          // Call edge function with explicit auth header
          const { data, error } = await supabase.functions.invoke('extract-business-card', {
            body: { imageBase64: base64data },
            headers: {
              Authorization: `Bearer ${session.access_token}`
            }
          });

          console.log('📥 Edge function response received');
          console.log('Response data:', data);
          console.log('Response error:', error);

          if (error) {
            console.error('❌ Edge function error:', JSON.stringify(error, null, 2));
            throw new Error(error.message || 'Failed to call edge function');
          }

          if (!data) {
            console.error('❌ No data returned from edge function');
            throw new Error('No response from server');
          }

          if (!data.success) {
            console.error('❌ Edge function returned failure:', data.error);
            throw new Error(data.error || 'Failed to extract contact information');
          }

          console.log('✅ Successfully extracted contact info:', JSON.stringify(data.contactInfo, null, 2));
          
          setExtractedData(data.contactInfo);
          console.log('📝 Set extracted data state');
          
          setIsConfirmationOpen(true);
          console.log('🎯 Opened confirmation dialog');
          
          toast({
            title: "Success!",
            description: "Contact information extracted successfully. Review and confirm below.",
          });
        } catch (innerError: any) {
          console.error('❌ Error in reader.onloadend:', innerError);
          throw innerError;
        }
      };

      reader.onerror = (readerError) => {
        console.error('❌ FileReader error:', readerError);
        throw new Error('Failed to read image file');
      };

    } catch (error: any) {
      console.error('❌ Error extracting business card:', error);
      console.error('Error stack:', error.stack);
      toast({
        title: "Error",
        description: error.message || "Failed to extract contact information",
        variant: "destructive",
      });
      setCardFile(null);
      setIsProcessing(false);
    }
  };

  const handleImportUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setIsProcessing(true);

    try {
      toast({
        title: "Processing...",
        description: "Analyzing contact file...",
      });

      // Check if the file needs manual mapping
      const needsMapping = await needsManualMapping(file);

      if (needsMapping) {
        // Show field mapping dialog for CSV files
        const content = await file.text();
        const result = getCSVHeaders(content);
        
        setCSVHeaders(result.headers);
        setCSVSampleData(result.data);
        setPendingFile(file);
        setIsFieldMappingOpen(true);
        
        toast({
          title: "Manual Mapping Required",
          description: "Please map your CSV columns to contact fields",
        });
      } else {
        // Auto-parse the file
        const contacts = await parseContactFile(file);
        
        if (contacts.length === 0) {
          throw new Error('No valid contacts found in file');
        }

        setParsedContacts(contacts);
        setIsImportPreviewOpen(true);
        
        toast({
          title: "Success!",
          description: `Found ${contacts.length} contact${contacts.length > 1 ? 's' : ''} in file`,
        });
      }

    } catch (error: any) {
      console.error('Error parsing contact file:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to parse contact file",
        variant: "destructive",
      });
      setImportFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmContact = async () => {
    if (!user || !extractedData) return;

    try {
      // Validate the contact data
      const validatedData = contactSchema.parse({
        name: extractedData.name,
        email: extractedData.email || null,
        phone: extractedData.phone || null,
        company: extractedData.company || null,
        title: extractedData.title || null,
        context_notes: extractedData.context_notes || null,
        meeting_location: extractedData.meeting_location || null,
        meeting_date: extractedData.meeting_date || null,
        tags: extractedData.tags || null,
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
        source: "business_card",
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Contact added successfully",
      });

      setExtractedData(null);
      setCardFile(null);
      fetchContacts();
    } catch (error: any) {
      console.error('Error saving contact:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save contact",
        variant: "destructive",
      });
    }
  };

  const handleEditConfirmation = () => {
    setIsConfirmationOpen(false);
    setIsAddDialogOpen(true);
  };

  const handleMappingComplete = async (mapping: FieldMapping) => {
    if (!pendingFile) return;

    setIsFieldMappingOpen(false);
    setIsProcessing(true);

    try {
      toast({
        title: "Processing...",
        description: "Parsing contacts with your mapping...",
      });

      const contacts = await parseContactFile(pendingFile, mapping);
      
      if (contacts.length === 0) {
        throw new Error('No valid contacts found with the selected mapping');
      }

      setParsedContacts(contacts);
      setIsImportPreviewOpen(true);
      setPendingFile(null);
      
      toast({
        title: "Success!",
        description: `Found ${contacts.length} contact${contacts.length > 1 ? 's' : ''} in file`,
      });

    } catch (error: any) {
      console.error('Error parsing with mapping:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to parse contacts",
        variant: "destructive",
      });
      setImportFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  // Bulk action handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedContactIds(new Set(filteredContacts.map(c => c.id)));
    } else {
      setSelectedContactIds(new Set());
    }
  };

  const handleSelectContact = (contactId: string, checked: boolean) => {
    const newSelected = new Set(selectedContactIds);
    if (checked) {
      newSelected.add(contactId);
    } else {
      newSelected.delete(contactId);
    }
    setSelectedContactIds(newSelected);
  };

  const handleBulkDelete = async () => {
    try {
      const idsToDelete = Array.from(selectedContactIds);
      const { error } = await supabase
        .from("contacts")
        .delete()
        .in("id", idsToDelete);

      if (error) throw error;

      toast({
        title: "Success!",
        description: `Deleted ${idsToDelete.length} contact${idsToDelete.length !== 1 ? 's' : ''}`,
      });

      setSelectedContactIds(new Set());
      fetchContacts();
    } catch (error: any) {
      console.error('Error deleting contacts:', error);
      toast({
        title: "Error",
        description: "Failed to delete contacts",
        variant: "destructive",
      });
    }
  };

  const handleBulkTag = async (tag: string) => {
    try {
      const idsToTag = Array.from(selectedContactIds);
      
      // Fetch current contacts to merge tags
      const { data: currentContacts, error: fetchError } = await supabase
        .from("contacts")
        .select("id, tags")
        .in("id", idsToTag);

      if (fetchError) throw fetchError;

      // Update each contact with the new tag (avoiding duplicates)
      const updates = currentContacts?.map(contact => {
        const currentTags = contact.tags || [];
        const newTags = currentTags.includes(tag) 
          ? currentTags 
          : [...currentTags, tag];
        
        return supabase
          .from("contacts")
          .update({ tags: newTags })
          .eq("id", contact.id);
      });

      if (updates) {
        await Promise.all(updates);
      }

      toast({
        title: "Success!",
        description: `Added tag "${tag}" to ${idsToTag.length} contact${idsToTag.length !== 1 ? 's' : ''}`,
      });

      setSelectedContactIds(new Set());
      fetchContacts();
    } catch (error: any) {
      console.error('Error adding tag:', error);
      toast({
        title: "Error",
        description: "Failed to add tag",
        variant: "destructive",
      });
    }
  };

  const handleExportCSV = () => {
    try {
      if (contacts.length === 0) {
        toast({
          title: "No contacts to export",
          description: "Add some contacts first before exporting",
          variant: "destructive",
        });
        return;
      }

      // CSV Headers
      const headers = [
        "Name",
        "Email",
        "Phone",
        "Company",
        "Title",
        "Tags",
        "Context Notes",
        "Meeting Location",
        "Meeting Date",
        "Source",
        "Created At"
      ];

      // Convert contacts to CSV rows
      const rows = contacts.map(contact => [
        contact.name || "",
        contact.email || "",
        contact.phone || "",
        contact.company || "",
        contact.title || "",
        (contact.tags || []).join("; ") || "",
        contact.context_notes || "",
        contact.meeting_location || "",
        contact.meeting_date ? format(new Date(contact.meeting_date), "yyyy-MM-dd") : "",
        contact.source || "",
        format(new Date(contact.created_at), "yyyy-MM-dd HH:mm:ss")
      ]);

      // Escape CSV values (handle commas, quotes, newlines)
      const escapeCSV = (value: string) => {
        if (value.includes(",") || value.includes('"') || value.includes("\n")) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      };

      // Build CSV content
      const csvContent = [
        headers.map(escapeCSV).join(","),
        ...rows.map(row => row.map(escapeCSV).join(","))
      ].join("\n");

      // Create blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      
      link.setAttribute("href", url);
      link.setAttribute("download", `contacts-backup-${format(new Date(), "yyyy-MM-dd")}.csv`);
      link.style.visibility = "hidden";
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export successful!",
        description: `Exported ${contacts.length} contact${contacts.length !== 1 ? 's' : ''} to CSV`,
      });
    } catch (error: any) {
      console.error('Error exporting contacts:', error);
      toast({
        title: "Error",
        description: "Failed to export contacts",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src={logoFull} alt="find.me" className="h-20" />
          </Link>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <UserIcon className="w-4 h-4" />
              <span>{user?.email}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <header className="mb-12">
          <h1 className="text-4xl font-extrabold text-foreground mb-4">
            Contact Dashboard
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            Add contacts to your find.me account. Choose one of the tools below to get started, or{" "}
            <a href="#contact-list" className="font-medium text-foreground hover:underline">
              go to your contacts list
            </a>.
          </p>
        </header>

        {/* Dashboard Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          {/* Tool 1: Scan Name Card */}
          <div className="bg-card rounded-xl shadow-md border border-border p-8">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mr-4">
                <Camera className="w-6 h-6 text-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Scan Name Card</h2>
            </div>
            <p className="text-muted-foreground mb-6">
              Use our AI-powered scanner to instantly digitize your physical business cards. Just upload a photo.
            </p>

            <div className="w-full">
              <label
                htmlFor="name-card-upload"
                className="flex flex-col items-center justify-center w-full h-48 p-6 border-2 border-dashed border-border rounded-lg text-center cursor-pointer hover:border-foreground transition-colors"
              >
                {isProcessing ? (
                  <>
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p className="text-lg font-medium text-foreground">Processing...</p>
                    <p className="text-sm text-muted-foreground mt-2">Extracting contact information</p>
                  </>
                ) : cardFile ? (
                  <>
                    <CheckCircle2 className="w-12 h-12 text-primary mb-2" />
                    <p className="text-lg font-medium text-foreground">{cardFile.name}</p>
                    <p className="text-sm text-muted-foreground mt-2">Click to change file</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-muted-foreground mb-2" />
                    <p className="text-lg font-medium text-foreground">Drag & drop a file here</p>
                    <p className="text-muted-foreground">
                      or <span className="font-medium text-foreground">click to upload</span>
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">PNG or JPG. Max 5MB.</p>
                  </>
                )}
              </label>
              <input
                ref={cardInputRef}
                type="file"
                className="hidden"
                id="name-card-upload"
                accept="image/png, image/jpeg"
                onChange={handleCardUpload}
              />
            </div>
          </div>

          {/* Tool 2: Import from File */}
          <div className="bg-card rounded-xl shadow-md border border-border p-8">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mr-4">
                <Upload className="w-6 h-6 text-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Import from File</h2>
            </div>
            <p className="text-muted-foreground mb-6">
              Upload an exported contact file from Google, Outlook, or your phone. We support .vcf and .csv files.
            </p>

            <div className="w-full">
              <label
                htmlFor="contact-file-upload"
                className="flex flex-col items-center justify-center w-full h-48 p-6 border-2 border-dashed border-border rounded-lg text-center cursor-pointer hover:border-foreground transition-colors"
              >
                {isProcessing ? (
                  <>
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p className="text-lg font-medium text-foreground">Processing...</p>
                    <p className="text-sm text-muted-foreground mt-2">Parsing contact file</p>
                  </>
                ) : importFile ? (
                  <>
                    <CheckCircle2 className="w-12 h-12 text-primary mb-2" />
                    <p className="text-lg font-medium text-foreground">{importFile.name}</p>
                    <p className="text-sm text-muted-foreground mt-2">Click to change file</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-muted-foreground mb-2" />
                    <p className="text-lg font-medium text-foreground">Drag & drop a file here</p>
                    <p className="text-muted-foreground">
                      or <span className="font-medium text-foreground">click to upload</span>
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">VCF or CSV. Max 10MB.</p>
                  </>
                )}
              </label>
              <input
                ref={importInputRef}
                type="file"
                className="hidden"
                id="contact-file-upload"
                accept=".vcf, .csv, text/vcard, text/csv"
                onChange={handleImportUpload}
              />
            </div>
          </div>
        </div>

        {/* Contact List Section */}
        <section id="contact-list" className="pt-12 border-t border-border">
          <header className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-3xl font-extrabold text-foreground mb-2">Your Contacts</h2>
                <p className="text-lg text-muted-foreground">
                  {contacts.length} {contacts.length === 1 ? "contact" : "contacts"} in your database
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleExportCSV} disabled={contacts.length === 0}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Contact
                </Button>
              </div>
            </div>
          </header>

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search contacts by name, company, or context..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12"
            />
          </div>

          {/* Tag Filters */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              <Button
                variant={selectedTag === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTag(null)}
              >
                All
              </Button>
              {allTags.map((tag) => (
                <Button
                  key={tag}
                  variant={selectedTag === tag ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTag(tag)}
                >
                  {tag}
                </Button>
              ))}
            </div>
          )}

          {/* Contact List */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading contacts...</p>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="bg-card rounded-xl shadow-md border border-border p-12 text-center">
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedTag
                  ? "No contacts match your search"
                  : "No contacts yet. Add your first contact to get started!"}
              </p>
              {!searchQuery && !selectedTag && (
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Contact
                </Button>
              )}
            </div>
          ) : (
            <>
              {selectedContactIds.size > 0 && (
                <BulkActionsToolbar
                  selectedCount={selectedContactIds.size}
                  onClearSelection={() => setSelectedContactIds(new Set())}
                  onBulkDelete={handleBulkDelete}
                  onBulkTag={handleBulkTag}
                />
              )}
              
              <div className="bg-card rounded-xl shadow-md border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={
                            filteredContacts.length > 0 &&
                            selectedContactIds.size === filteredContacts.length
                          }
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all contacts"
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Meeting Date</TableHead>
                      <TableHead>Tags</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContacts.map((contact) => (
                      <TableRow
                        key={contact.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={(e) => {
                          // Don't open detail dialog if clicking checkbox
                          if ((e.target as HTMLElement).closest('[role="checkbox"]')) {
                            return;
                          }
                          setSelectedContact(contact);
                        }}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedContactIds.has(contact.id)}
                            onCheckedChange={(checked) =>
                              handleSelectContact(contact.id, checked as boolean)
                            }
                            aria-label={`Select ${contact.name}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{contact.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {contact.email || "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {contact.phone || "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {contact.company || "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {contact.title || "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {contact.meeting_date
                            ? format(new Date(contact.meeting_date), "MMM d, yyyy")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {contact.tags && contact.tags.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {contact.tags.slice(0, 2).map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                                >
                                  {tag}
                                </span>
                              ))}
                              {contact.tags.length > 2 && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                                  +{contact.tags.length - 2}
                                </span>
                              )}
                            </div>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </section>
      </main>

      <ContactConfirmationDialog
        open={isConfirmationOpen}
        onOpenChange={(open) => {
          setIsConfirmationOpen(open);
          if (!open) {
            setExtractedData(null);
            setCardFile(null);
          }
        }}
        contactData={extractedData || { name: "" }}
        onConfirm={handleConfirmContact}
        onEdit={handleEditConfirmation}
        title="Confirm Business Card Scan"
        description="Review the information extracted from the business card before adding to your contacts."
      />

      <AddContactDialog
        open={isAddDialogOpen}
        onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) {
            setExtractedData(null);
            setCardFile(null);
          }
        }}
        onContactAdded={fetchContacts}
        initialData={extractedData}
      />

      <ContactDetailDialog
        contact={selectedContact}
        open={!!selectedContact}
        onOpenChange={(open) => !open && setSelectedContact(null)}
        onContactUpdated={fetchContacts}
        onContactDeleted={fetchContacts}
      />

      <ImportPreviewDialog
        open={isImportPreviewOpen}
        onOpenChange={(open) => {
          setIsImportPreviewOpen(open);
          if (!open) {
            setImportFile(null);
            setParsedContacts([]);
          }
        }}
        contacts={parsedContacts}
        onImportComplete={fetchContacts}
      />

      <FieldMappingDialog
        open={isFieldMappingOpen}
        onOpenChange={(open) => {
          setIsFieldMappingOpen(open);
          if (!open) {
            setImportFile(null);
            setPendingFile(null);
            setCSVHeaders([]);
            setCSVSampleData([]);
          }
        }}
        csvHeaders={csvHeaders}
        sampleData={csvSampleData}
        onMappingComplete={handleMappingComplete}
      />
    </div>
  );
};

export default Dashboard;
