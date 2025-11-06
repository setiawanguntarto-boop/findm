import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Tag, X } from "lucide-react";
import { useState } from "react";
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

interface BulkActionsToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkDelete: () => void;
  onBulkTag: (tag: string) => void;
}

export const BulkActionsToolbar = ({
  selectedCount,
  onClearSelection,
  onBulkDelete,
  onBulkTag,
}: BulkActionsToolbarProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [newTag, setNewTag] = useState("");

  const handleTagSubmit = () => {
    if (newTag.trim()) {
      onBulkTag(newTag.trim());
      setNewTag("");
      setShowTagDialog(false);
    }
  };

  return (
    <>
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-medium text-foreground">
            {selectedCount} contact{selectedCount !== 1 ? "s" : ""} selected
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="h-8"
          >
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTagDialog(true)}
            className="h-8"
          >
            <Tag className="w-4 h-4 mr-2" />
            Add Tag
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            className="h-8"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCount} contact{selectedCount !== 1 ? "s" : ""}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected contact{selectedCount !== 1 ? "s" : ""} from your database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onBulkDelete();
                setShowDeleteDialog(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Tag Dialog */}
      <AlertDialog open={showTagDialog} onOpenChange={setShowTagDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add Tag to {selectedCount} contact{selectedCount !== 1 ? "s" : ""}</AlertDialogTitle>
            <AlertDialogDescription>
              Enter a tag to add to all selected contacts. If contacts already have this tag, it won't be duplicated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              placeholder="Enter tag name..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleTagSubmit();
                }
              }}
              autoFocus
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setNewTag("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleTagSubmit}
              disabled={!newTag.trim()}
            >
              Add Tag
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
