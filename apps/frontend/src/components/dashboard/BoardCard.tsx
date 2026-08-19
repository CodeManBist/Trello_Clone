import { useNavigate } from "react-router-dom";
import { FolderKanban } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type { Board } from "@/services/boards";

interface BoardCardProps {
  board: Board;
}

const BoardCard = ({ board }: BoardCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/boards/${board.id}`);
  };

  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-muted/50"
      onClick={handleClick}
    >
      <CardHeader>
        <FolderKanban className="mb-2 h-5 w-5" />

        <CardTitle>
          {board.title}
        </CardTitle>

        <CardDescription>
          {board.description || "No description"}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <p className="text-sm text-muted-foreground">
          Open board →
        </p>
      </CardContent>
    </Card>
  );
};

export default BoardCard;