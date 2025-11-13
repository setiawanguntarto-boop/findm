import { useState } from "react";
import { Contact } from "@/pages/Dashboard";
import { DuplicateGroup, saveDismissedPair } from "@/utils/contactDuplicateDetector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  AlertCircle, 
  CheckCircle2, 
  Merge, 
  X, 
  Eye,
  ChevronDown,
  ChevronUp 
} from "lucide-react";
import { ContactMergeDialog } from "./ContactMergeDialog";
import { toast } from "@/hooks/use-toast";

interface DuplicatesSectionProps {
  duplicateGroups: DuplicateGroup[];
  onRefresh: () => void;
  onMerge: (contacts: Contact[], mergedContact: Partial<Contact>) => Promise<void>;
  userId: string;
}

export const DuplicatesSection = ({
  duplicateGroups,
  onRefresh,
  onMerge,
  userId,
}: DuplicatesSectionProps) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set([0]));
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Contact[] | null>(null);

  const toggleGroup = (index: number) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedGroups(newExpanded);
  };

  const handleDismiss = (group: DuplicateGroup) => {
    // Save all pairs in this group as dismissed
    const contacts = group.contacts;
    for (let i = 0; i < contacts.length; i++) {
      for (let j = i + 1; j < contacts.length; j++) {
        saveDismissedPair(userId, contacts[i].id, contacts[j].id);
      }
    }
    
    toast({
      title: "Duplicates dismissed",
      description: "This group won't be shown again.",
    });
    
    onRefresh();
  };

  const handleMergeClick = (group: DuplicateGroup) => {
    setSelectedGroup(group.contacts);
    setMergeDialogOpen(true);
  };

  const handleMergeComplete = async (mergedContact: Partial<Contact>) => {
    if (selectedGroup) {
      await onMerge(selectedGroup, mergedContact);
      setMergeDialogOpen(false);
      setSelectedGroup(null);
      onRefresh();
    }
  };

  const getConfidenceBadge = (confidence: 'high' | 'medium' | 'low') => {
    const variants = {
      high: { variant: "destructive" as const, icon: AlertCircle, text: "High Confidence" },
      medium: { variant: "default" as const, icon: Eye, text: "Review Needed" },
      low: { variant: "secondary" as const, icon: CheckCircle2, text: "Possible Match" },
    };
    
    const { variant, icon: Icon, text } = variants[confidence];
    
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {text}
      </Badge>
    );
  };

  const highConfidenceGroups = duplicateGroups.filter(g => g.confidence === 'high');
  const mediumConfidenceGroups = duplicateGroups.filter(g => g.confidence === 'medium');
  const lowConfidenceGroups = duplicateGroups.filter(g => g.confidence === 'low');

  if (duplicateGroups.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle2 className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Duplicates Found</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Your contact list looks clean! We'll automatically check for duplicates when you add new contacts.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Statistics Banner */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">Duplicate Detection</h2>
                <p className="text-muted-foreground">
                  Found <strong>{duplicateGroups.length}</strong> potential duplicate{duplicateGroups.length !== 1 ? ' groups' : ' group'} ({' '}
                  {highConfidenceGroups.length > 0 && <span className="text-destructive font-semibold">{highConfidenceGroups.length} high</span>}
                  {highConfidenceGroups.length > 0 && (mediumConfidenceGroups.length > 0 || lowConfidenceGroups.length > 0) && ', '}
                  {mediumConfidenceGroups.length > 0 && <span className="font-semibold">{mediumConfidenceGroups.length} medium</span>}
                  {mediumConfidenceGroups.length > 0 && lowConfidenceGroups.length > 0 && ', '}
                  {lowConfidenceGroups.length > 0 && <span className="text-muted-foreground font-semibold">{lowConfidenceGroups.length} low</span>}
                  {' '})
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Duplicate Groups */}
        {[...highConfidenceGroups, ...mediumConfidenceGroups, ...lowConfidenceGroups].map((group, index) => {
          const isExpanded = expandedGroups.has(index);
          
          return (
            <Card key={index} className="overflow-hidden">
              <CardHeader 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleGroup(index)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {getConfidenceBadge(group.confidence)}
                    <div>
                      <CardTitle className="text-base">
                        {group.contacts.length} Contacts - {group.matchReasons.join(', ')}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Match Score: {group.score}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0">
                  <Separator className="mb-4" />
                  
                  {/* Contact Cards */}
                  <div className="space-y-3 mb-4">
                    {group.contacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="p-4 rounded-lg border bg-card"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-base">{contact.name}</h4>
                            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                              {contact.email && (
                                <p>📧 {contact.email}</p>
                              )}
                              {contact.phone && (
                                <p>📱 {contact.phone}</p>
                              )}
                              {contact.company && (
                                <p>🏢 {contact.company}</p>
                              )}
                              {contact.title && (
                                <p>💼 {contact.title}</p>
                              )}
                            </div>
                            {contact.tags && contact.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {contact.tags.map((tag, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleMergeClick(group)}
                      className="flex-1"
                    >
                      <Merge className="w-4 h-4 mr-2" />
                      Merge Contacts
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDismiss(group)}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Keep Separate
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Merge Dialog */}
      {selectedGroup && (
        <ContactMergeDialog
          open={mergeDialogOpen}
          onOpenChange={setMergeDialogOpen}
          contacts={selectedGroup}
          onMerge={handleMergeComplete}
        />
      )}
    </>
  );
};
