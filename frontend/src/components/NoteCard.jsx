import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckSquare, Loader2, Sparkles, Trash2, UserRoundCheck } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

import { api, getApiErrorMessage } from "../lib/api";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

const AI_ACTIONS = [
  {
    label: "Summarize",
    icon: Sparkles,
    instruction: "Summarize this note into concise, actionable bullet points.",
  },
  {
    label: "Tone",
    icon: UserRoundCheck,
    instruction:
      "Rewrite this note in a polished, professional tone while keeping the same meaning.",
  },
  {
    label: "Checklist",
    icon: CheckSquare,
    instruction:
      "Transform this note into a clear markdown checklist with practical action items.",
  },
];

export default function NoteCard({ note }) {
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [processingAction, setProcessingAction] = useState(null);

  const deleteNote = useMutation({
    mutationFn: async () => api.delete(`/api/notes/${note.id}`),
    onSuccess: () => {
      setDeleteOpen(false);
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      toast.success("Note deleted");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to delete note"));
    },
  });

  const transformNote = useMutation({
    mutationFn: async (action) => {
      setProcessingAction(action.label);
      const transformResponse = await api.post("/api/ai/transform", {
        note_id: note.id,
        instruction: action.instruction,
      });
      await api.patch(`/api/notes/${note.id}`, {
        content: transformResponse.data.result,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      toast.success("Note updated");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "AI transform failed"));
    },
    onSettled: () => {
      setProcessingAction(null);
    },
  });

  return (
    <Card className="relative flex min-h-[220px] flex-col overflow-hidden">
      {processingAction && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-card/85 text-sm font-medium backdrop-blur-sm">
          <Loader2 className="mb-2 h-5 w-5 animate-spin text-primary" />
          {processingAction}
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="break-words text-base leading-6">{note.title}</CardTitle>
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogTrigger asChild>
              <Button aria-label="Delete note" size="icon" variant="ghost">
                <Trash2 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete note?</DialogTitle>
                <DialogDescription>
                  This note will be permanently removed from SmartKeep.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteNote.mutate()}
                  disabled={deleteNote.isPending}
                >
                  {deleteNote.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-4">
        <ReactMarkdown className="markdown-content">{note.content}</ReactMarkdown>
        {note.tags?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {note.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-accent px-2 py-1 text-xs font-medium text-accent-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t bg-muted/35 p-2">
        <div className="flex w-full items-center justify-between gap-2">
          {AI_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.label}
                className="flex-1"
                size="sm"
                variant="ghost"
                onClick={() => transformNote.mutate(action)}
                disabled={transformNote.isPending}
                title={action.label}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{action.label}</span>
              </Button>
            );
          })}
        </div>
      </CardFooter>
    </Card>
  );
}
