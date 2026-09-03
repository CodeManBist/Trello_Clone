import { useState } from "react";
import { Loader2, Plus } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  createBoard,
  updateBoard,
  type Board,
} from "@/services/boards";

interface BoardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  onBoardCreated: (board: Board) => void;
  board?: Board | null;
}

const BoardDialog = ({
  open,
  onOpenChange,
  organizationId,
  onBoardCreated,
  board,
}: BoardDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setDescription("");
    setError(null);
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!name.trim()) {
      setError("Board name is required.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if(board) {
        //update existing board
        const updatedBoard = await updateBoard(
          board.id,
          name.trim(),
          description.trim()
        );

        onBoardCreated(updatedBoard);
      } else {
        
        //create new board
        const newBoard = await createBoard(
          organizationId,
          name.trim(),
          description.trim()
        );
  
        // Add the newly created board to Dashboard
        onBoardCreated(newBoard);
  
        resetForm();
        onOpenChange(false);
      }

    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(board ? "Failed to update board." : "Failed to create board.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (value: boolean) => {
    if (!value && !loading) {
      resetForm();
    }

    onOpenChange(value);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {board ? "Edit Board" : "Create a new board"}
          </DialogTitle>

          <DialogDescription>
            Create a board for the selected organization.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5 py-4">

            {/* Board name */}
            <div className="space-y-2">
              <Label htmlFor="board-name">
                Board name
              </Label>

              <Input
                id="board-name"
                placeholder="e.g. Engineering"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                disabled={loading}
                autoFocus
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="board-description">
                Description
              </Label>

              <Textarea
                id="board-description"
                placeholder="What is this board for?"
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                disabled={loading}
                className="min-h-24 resize-none"
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={loading || !name.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {board ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  {board ? "Update Board" : "Create Board"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BoardDialog;