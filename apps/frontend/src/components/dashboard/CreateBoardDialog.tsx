import { useState } from "react";
import { Loader2, Plus } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  createBoard,
  type Board,
} from "@/services/boards";

interface CreateBoardDialogProps {
  organizationId: string;
  onBoardCreated: (board: Board) => void;
}

const CreateBoardDialog = ({
  organizationId,
  onBoardCreated,
}: CreateBoardDialogProps) => {
  const [open, setOpen] = useState(false);

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

      const board = await createBoard(
        organizationId,
        name.trim(),
        description.trim()
      );

      // Give the newly created board to Dashboard
      onBoardCreated(board);

      resetForm();
      setOpen(false);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to create board.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (value: boolean) => {
    setOpen(value);

    if (!value) {
      resetForm();
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Board
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">

        <DialogHeader>
          <DialogTitle>
            Create a new board
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
              onClick={() => setOpen(false)}
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
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Board
                </>
              )}
            </Button>
          </DialogFooter>
        </form>

      </DialogContent>
    </Dialog>
  );
};

export default CreateBoardDialog;