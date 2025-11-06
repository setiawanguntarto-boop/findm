import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, LogOut, User as UserIcon, Camera, Upload, CheckCircle2 } from "lucide-react";
import ContactCard from "@/components/ContactCard";
import AddContactDialog from "@/components/AddContactDialog";
import ContactDetailDialog from "@/components/ContactDetailDialog";
import ImportPreviewDialog from "@/components/ImportPreviewDialog";
import { useToast } from "@/hooks/use-toast";
import logoFull from "@/assets/logo-full.png";
import { useNavigate, Link } from "react-router-dom";
import { parseContactFile, ParsedContact } from "@/utils/contactParser";

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
    if (!file) return;

    setCardFile(file);
    setIsProcessing(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        
        toast({
          title: "Processing...",
          description: "Extracting contact information from business card...",
        });

        // Call edge function
        const { data, error } = await supabase.functions.invoke('extract-business-card', {
          body: { imageBase64: base64data }
        });

        if (error) {
          console.error('Error calling edge function:', error);
          throw error;
        }

        if (!data.success) {
          throw new Error(data.error || 'Failed to extract contact information');
        }

        console.log('Extracted contact info:', data.contactInfo);
        
        setExtractedData(data.contactInfo);
        setIsAddDialogOpen(true);
        
        toast({
          title: "Success!",
          description: "Contact information extracted successfully",
        });
      };

      reader.onerror = () => {
        throw new Error('Failed to read image file');
      };

    } catch (error: any) {
      console.error('Error extracting business card:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to extract contact information",
        variant: "destructive",
      });
      setCardFile(null);
    } finally {
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
        description: "Parsing contact file...",
      });

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
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Contact
              </Button>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredContacts.map((contact) => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  onClick={() => setSelectedContact(contact)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

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
    </div>
  );
};

export default Dashboard;
