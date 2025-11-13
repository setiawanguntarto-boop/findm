import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, LogOut, User as UserIcon, Camera, Upload, CheckCircle2, Download, Scan } from "lucide-react";
import ContactCard from "@/components/ContactCard";
import AddContactDialog from "@/components/AddContactDialog";
import ContactDetailDialog from "@/components/ContactDetailDialog";
import ContactConfirmationDialog from "@/components/ContactConfirmationDialog";
import ImportPreviewDialog from "@/components/ImportPreviewDialog";
import FieldMappingDialog, { FieldMapping } from "@/components/FieldMappingDialog";
import { BulkActionsToolbar } from "@/components/BulkActionsToolbar";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ContactMergeDialog } from "@/components/ContactMergeDialog";
import { AdvancedFilterPanel, FilterState, SortOption } from "@/components/AdvancedFilterPanel";
import { FollowUpRemindersSection } from "@/components/FollowUpRemindersSection";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { contactSchema } from "@/utils/contactSchema";
import logoFull from "@/assets/logo-new.png";
import { useNavigate, Link } from "react-router-dom";
import { parseContactFile, ParsedContact, needsManualMapping, getCSVHeaders } from "@/utils/contactParser";
import { findDuplicateGroups, getDismissedPairs, DuplicateGroup } from "@/utils/contactDuplicateDetector";
import { DuplicatesSection } from "@/components/DuplicatesSection";
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
  follow_up_date?: string;
  follow_up_notes?: string;
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
  
  // Advanced filters state
  const [filterState, setFilterState] = useState<FilterState>({
    tags: [],
    tagLogic: "OR",
    companies: [],
    sources: [],
    meetingDateFrom: undefined,
    meetingDateTo: undefined,
    createdDateFrom: undefined,
    createdDateTo: undefined,
    followUpFilter: "all",
    sortBy: "created-desc",
  });

  // Load filters from localStorage when user is available
  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`filters-${user.id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Convert date strings back to Date objects
          setFilterState({
            ...parsed,
            meetingDateFrom: parsed.meetingDateFrom ? new Date(parsed.meetingDateFrom) : undefined,
            meetingDateTo: parsed.meetingDateTo ? new Date(parsed.meetingDateTo) : undefined,
            createdDateTo: parsed.createdDateTo ? new Date(parsed.createdDateTo) : undefined,
            createdDateFrom: parsed.createdDateFrom ? new Date(parsed.createdDateFrom) : undefined,
          });
        } catch {
          // If parsing fails, keep default
        }
      }
    }
  }, [user]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [cardFile, setCardFile] = useState<File | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [parsedContacts, setParsedContacts] = useState<ParsedContact[]>([]);
  const [isCardProcessing, setIsCardProcessing] = useState(false);
  const [isImportProcessing, setIsImportProcessing] = useState(false);
  const [isImportPreviewOpen, setIsImportPreviewOpen] = useState(false);
  const [isFieldMappingOpen, setIsFieldMappingOpen] = useState(false);
  const [csvHeaders, setCSVHeaders] = useState<string[]>([]);
  const [csvSampleData, setCSVSampleData] = useState<string[][]>([]);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isMergeDialogOpen, setIsMergeDialogOpen] = useState(false);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const cardInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const checkForDuplicates = () => {
    if (!user) return;
    const dismissedPairs = getDismissedPairs(user.id);
    const groups = findDuplicateGroups(contacts, dismissedPairs);
    setDuplicateGroups(groups);
  };

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
    checkForDuplicates();
  }, [contacts, user]);

  // Save filters to localStorage (serialize dates as ISO strings)
  useEffect(() => {
    if (user) {
      const toSave = {
        ...filterState,
        meetingDateFrom: filterState.meetingDateFrom?.toISOString(),
        meetingDateTo: filterState.meetingDateTo?.toISOString(),
        createdDateFrom: filterState.createdDateFrom?.toISOString(),
        createdDateTo: filterState.createdDateTo?.toISOString(),
      };
      localStorage.setItem(`filters-${user.id}`, JSON.stringify(toSave));
    }
  }, [filterState, user]);

  // Advanced filtering and sorting logic
  useEffect(() => {
    let filtered = [...contacts];

    // Text search
    if (searchQuery) {
      filtered = filtered.filter(
        (contact) =>
          contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.context_notes?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Tag filtering (AND/OR logic)
    if (filterState.tags.length > 0) {
      if (filterState.tagLogic === "AND") {
        filtered = filtered.filter((contact) =>
          filterState.tags.every((tag) => contact.tags?.includes(tag))
        );
      } else {
        // OR logic
        filtered = filtered.filter((contact) =>
          filterState.tags.some((tag) => contact.tags?.includes(tag))
        );
      }
    }

    // Legacy tag filter (for backward compatibility)
    if (selectedTag) {
      filtered = filtered.filter((contact) =>
        contact.tags?.includes(selectedTag)
      );
    }

    // Company filtering
    if (filterState.companies.length > 0) {
      filtered = filtered.filter((contact) =>
        contact.company && filterState.companies.includes(contact.company)
      );
    }

    // Source filtering
    if (filterState.sources.length > 0) {
      filtered = filtered.filter((contact) =>
        contact.source && filterState.sources.includes(contact.source)
      );
    }

    // Meeting date range filtering
    if (filterState.meetingDateFrom || filterState.meetingDateTo) {
      filtered = filtered.filter((contact) => {
        if (!contact.meeting_date) return false;
        const meetingDate = new Date(contact.meeting_date);
        const from = filterState.meetingDateFrom;
        const to = filterState.meetingDateTo;
        
        if (from && to) {
          return meetingDate >= from && meetingDate <= to;
        } else if (from) {
          return meetingDate >= from;
        } else if (to) {
          return meetingDate <= to;
        }
        return true;
      });
    }

    // Created date range filtering
    if (filterState.createdDateFrom || filterState.createdDateTo) {
      filtered = filtered.filter((contact) => {
        const createdDate = new Date(contact.created_at);
        const from = filterState.createdDateFrom;
        const to = filterState.createdDateTo;
        
        if (from && to) {
          return createdDate >= from && createdDate <= to;
        } else if (from) {
          return createdDate >= from;
        } else if (to) {
          return createdDate <= to;
        }
        return true;
      });
    }

    // Follow-up filtering
    if (filterState.followUpFilter !== "all" && filterState.followUpFilter) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekFromNow = new Date(today);
      weekFromNow.setDate(weekFromNow.getDate() + 7);

      filtered = filtered.filter((contact) => {
        if (!contact.follow_up_date) return false;
        
        try {
          const followUpDate = new Date(contact.follow_up_date);
          
          // Validate date
          if (isNaN(followUpDate.getTime())) {
            return false;
          }
          
          const followUpDay = new Date(followUpDate.getFullYear(), followUpDate.getMonth(), followUpDate.getDate());

          switch (filterState.followUpFilter) {
            case "upcoming":
              return followUpDate >= now;
            case "overdue":
              return followUpDate < today;
            case "today":
              return followUpDay.getTime() === today.getTime();
            case "thisWeek":
              return followUpDate >= today && followUpDate <= weekFromNow;
            default:
              return true;
          }
        } catch (error) {
          console.error('Error filtering by follow-up date:', error, contact);
          return false;
        }
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (filterState.sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "company-asc":
          return (a.company || "").localeCompare(b.company || "");
        case "company-desc":
          return (b.company || "").localeCompare(a.company || "");
        case "date-asc":
          if (!a.meeting_date && !b.meeting_date) return 0;
          if (!a.meeting_date) return 1;
          if (!b.meeting_date) return -1;
          return new Date(a.meeting_date).getTime() - new Date(b.meeting_date).getTime();
        case "date-desc":
          if (!a.meeting_date && !b.meeting_date) return 0;
          if (!a.meeting_date) return 1;
          if (!b.meeting_date) return -1;
          return new Date(b.meeting_date).getTime() - new Date(a.meeting_date).getTime();
        case "created-asc":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "created-desc":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    setFilteredContacts(filtered);
  }, [searchQuery, selectedTag, contacts, filterState]);

  const allTags = Array.from(
    new Set(contacts.flatMap((c) => c.tags || []))
  ).sort();

  const allCompanies = Array.from(
    new Set(contacts.map((c) => c.company).filter(Boolean) as string[])
  ).sort();

  const allSources = Array.from(
    new Set(contacts.map((c) => c.source).filter(Boolean) as string[])
  ).sort();

  // Calculate active filter count
  const activeFilterCount = 
    filterState.tags.length +
    filterState.companies.length +
    filterState.sources.length +
    (filterState.meetingDateFrom || filterState.meetingDateTo ? 1 : 0) +
    (filterState.createdDateFrom || filterState.createdDateTo ? 1 : 0) +
    (filterState.followUpFilter !== "all" ? 1 : 0) +
    (filterState.sortBy !== "created-desc" ? 1 : 0);

  const handleFilterChange = (newFilters: FilterState) => {
    setFilterState(newFilters);
    // Clear legacy tag selection when using advanced filters
    if (newFilters.tags.length > 0) {
      setSelectedTag(null);
    }
  };

  const handleClearFilters = () => {
    const defaultFilters: FilterState = {
      tags: [],
      tagLogic: "OR",
      companies: [],
      sources: [],
      meetingDateFrom: undefined,
      meetingDateTo: undefined,
      createdDateFrom: undefined,
      createdDateTo: undefined,
      followUpFilter: "all",
      sortBy: "created-desc",
    };
    setFilterState(defaultFilters);
    setSelectedTag(null);
  };

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
    setIsCardProcessing(true);

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
          
          setIsCardProcessing(false);
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
      setIsCardProcessing(false);
      // Reset file input
      if (cardInputRef.current) {
        cardInputRef.current.value = '';
      }
    }
  };

  const handleImportUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setIsImportProcessing(true);

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
        setIsImportProcessing(false);
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
        setIsImportProcessing(false);
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
      // Reset file input
      if (importInputRef.current) {
        importInputRef.current.value = '';
      }
    } finally {
      setIsImportProcessing(false);
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
      setIsCardProcessing(false);
      setIsConfirmationOpen(false);
      fetchContacts();
      
      // Reset file input
      if (cardInputRef.current) {
        cardInputRef.current.value = '';
      }
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
    setIsCardProcessing(false);
    setIsAddDialogOpen(true);
  };

  const handleMappingComplete = async (mapping: FieldMapping) => {
    if (!pendingFile) return;

    setIsFieldMappingOpen(false);
    setIsImportProcessing(true);

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
      setIsImportProcessing(false);
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
      // Reset file input
      if (importInputRef.current) {
        importInputRef.current.value = '';
      }
    } finally {
      setIsImportProcessing(false);
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

  const handleMergeContacts = async (mergedContact: Partial<Contact>, contactIdsToDelete: string[]) => {
    try {
      if (!user) return;

      const selectedIds = Array.from(selectedContactIds);
      if (selectedIds.length < 2) {
        toast({
          title: "Error",
          description: "Please select at least 2 contacts to merge",
          variant: "destructive",
        });
        return;
      }

      // Update the first contact with merged data
      const primaryContactId = selectedIds[0];
      const { error: updateError } = await supabase
        .from("contacts")
        .update(mergedContact)
        .eq("id", primaryContactId);

      if (updateError) throw updateError;

      // Delete the other contacts
      const { error: deleteError } = await supabase
        .from("contacts")
        .delete()
        .in("id", contactIdsToDelete);

      if (deleteError) throw deleteError;

      toast({
        title: "Success!",
        description: `Merged ${selectedIds.length} contacts into one`,
      });

      setIsMergeDialogOpen(false);
      setSelectedContactIds(new Set());
      fetchContacts();
    } catch (error: any) {
      console.error("Error merging contacts:", error);
      toast({
        title: "Error",
        description: "Failed to merge contacts",
        variant: "destructive",
      });
    }
  };

  const handleExportCSV = (exportType: 'all' | 'filtered' | 'selected' = 'all') => {
    try {
      let contactsToExport: Contact[] = [];
      let fileName = "";

      // Determine which contacts to export
      switch (exportType) {
        case 'selected':
          if (selectedContactIds.size === 0) {
            toast({
              title: "No contacts selected",
              description: "Select contacts to export",
              variant: "destructive",
            });
            return;
          }
          contactsToExport = contacts.filter(c => selectedContactIds.has(c.id));
          fileName = `contacts-selected-${format(new Date(), "yyyy-MM-dd")}.csv`;
          break;
        case 'filtered':
          if (filteredContacts.length === 0) {
            toast({
              title: "No contacts to export",
              description: "No contacts match your current filters",
              variant: "destructive",
            });
            return;
          }
          contactsToExport = filteredContacts;
          fileName = `contacts-filtered-${format(new Date(), "yyyy-MM-dd")}.csv`;
          break;
        case 'all':
        default:
          if (contacts.length === 0) {
            toast({
              title: "No contacts to export",
              description: "Add some contacts first before exporting",
              variant: "destructive",
            });
            return;
          }
          contactsToExport = contacts;
          fileName = `contacts-all-${format(new Date(), "yyyy-MM-dd")}.csv`;
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
      const rows = contactsToExport.map(contact => [
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
      link.setAttribute("download", fileName);
      link.style.visibility = "hidden";
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export successful!",
        description: `Exported ${contactsToExport.length} contact${contactsToExport.length !== 1 ? 's' : ''} to CSV`,
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

        {/* Follow-up Reminders Section */}
        {contacts.filter((c) => c.follow_up_date).length > 0 && (
          <div className="mb-12">
            <FollowUpRemindersSection
              contacts={contacts}
              onContactClick={(contact) => setSelectedContact(contact)}
            />
          </div>
        )}

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
                {isCardProcessing ? (
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
                {isImportProcessing ? (
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
                  {searchQuery || selectedTag ? ` (${filteredContacts.length} filtered)` : ''}
                  {duplicateGroups.length > 0 && !showDuplicates && (
                    <span className="text-destructive font-semibold ml-2">
                      • {duplicateGroups.length} duplicate group{duplicateGroups.length !== 1 ? 's' : ''} found
                    </span>
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                {duplicateGroups.length > 0 && (
                  <Button 
                    variant={showDuplicates ? "default" : "outline"}
                    onClick={() => setShowDuplicates(!showDuplicates)}
                  >
                    <Scan className="w-4 h-4 mr-2" />
                    {showDuplicates ? 'Show All Contacts' : `Review Duplicates (${duplicateGroups.length})`}
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" disabled={contacts.length === 0}>
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleExportCSV('all')}>
                      Export All Contacts ({contacts.length})
                    </DropdownMenuItem>
                    {(searchQuery || selectedTag || activeFilterCount > 0) && filteredContacts.length > 0 && (
                      <DropdownMenuItem onClick={() => handleExportCSV('filtered')}>
                        Export Filtered Contacts ({filteredContacts.length})
                      </DropdownMenuItem>
                    )}
                    {selectedContactIds.size > 0 && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleExportCSV('selected')}>
                          Export Selected ({selectedContactIds.size})
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Contact
                </Button>
              </div>
            </div>
          </header>

          {/* Show Duplicates Section or Contact List */}
          {showDuplicates ? (
            <DuplicatesSection
              duplicateGroups={duplicateGroups}
              onRefresh={checkForDuplicates}
              onMerge={async (contactsToMerge, mergedContact) => {
                const contactIdsToDelete = contactsToMerge.map(c => c.id);
                await handleMergeContacts(mergedContact, contactIdsToDelete);
              }}
              userId={user?.id || ''}
            />
          ) : (
            <>
              {/* Search Bar */}
              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search contacts by name, company, or context..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12"
                />
              </div>

              {/* Advanced Filter Panel */}
              <div className="mb-6">
                <AdvancedFilterPanel
                  allTags={allTags}
                  allCompanies={allCompanies}
                  allSources={allSources}
                  filterState={filterState}
                  onFilterChange={handleFilterChange}
                  onClearFilters={handleClearFilters}
                  activeFilterCount={activeFilterCount}
                />
              </div>

              {/* Legacy Tag Filters (for quick access) */}
              {allTags.length > 0 && filterState.tags.length === 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
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
                    {searchQuery || selectedTag || activeFilterCount > 0
                      ? "No contacts match your search or filters"
                      : "No contacts yet. Add your first contact to get started!"}
                  </p>
                  {!searchQuery && !selectedTag && activeFilterCount === 0 && (
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
                      onMerge={selectedContactIds.size >= 2 ? () => setIsMergeDialogOpen(true) : undefined}
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
            setIsCardProcessing(false);
            // Reset file input
            if (cardInputRef.current) {
              cardInputRef.current.value = '';
            }
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
            setIsCardProcessing(false);
            // Reset file input
            if (cardInputRef.current) {
              cardInputRef.current.value = '';
            }
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
            setIsImportProcessing(false);
            // Reset file input
            if (importInputRef.current) {
              importInputRef.current.value = '';
            }
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
            setIsImportProcessing(false);
            setCSVHeaders([]);
            // Reset file input
            if (importInputRef.current) {
              importInputRef.current.value = '';
            }
            setCSVSampleData([]);
          }
        }}
        csvHeaders={csvHeaders}
        sampleData={csvSampleData}
        onMappingComplete={handleMappingComplete}
      />

      <ContactMergeDialog
        open={isMergeDialogOpen}
        onOpenChange={setIsMergeDialogOpen}
        contacts={contacts.filter((c) => selectedContactIds.has(c.id))}
        onMerge={handleMergeContacts}
      />
    </div>
  );
};

export default Dashboard;
