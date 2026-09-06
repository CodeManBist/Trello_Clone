import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createSection, updateSection, type Section } from "@/services/section";

type SectionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string;
  section?: Section | null;
  onSaved: (section: Section) => void;
};

const SectionDialog = ({ open, onOpenChange, boardId, section = null, onSaved }: SectionDialogProps) => {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isEditing = Boolean(section);

  useEffect(() => {
    if (open) {
      setTitle(section?.title ?? "");
      setError("");
    }
  }, [open, section]);

  const save = async () => {
    const value = title.trim();
    if (!value) {
      setError("Section name is required.");
      return;
    }
    try {
      setLoading(true);
      const saved = section ? await updateSection(section.id, value) : await createSection(boardId, value);
      onSaved(saved);
      onOpenChange(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save section.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !loading && onOpenChange(value)}>
      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Rename section" : "Create section"}</DialogTitle>
          <DialogDescription>Use a clear name for this workflow column.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <label htmlFor="section-title" className="text-sm font-medium">Section name</label>
          <Input id="section-title" value={title} onChange={(event) => setTitle(event.target.value)} disabled={loading} autoFocus />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button type="button" onClick={save} disabled={loading || !title.trim()}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SectionDialog;
