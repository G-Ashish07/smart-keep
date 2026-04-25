import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { api, getApiErrorMessage } from "../lib/api";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

export default function CreateNote() {
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const createNote = useMutation({
    mutationFn: async (payload) => {
      const response = await api.post("/api/notes", payload);
      return response.data;
    },
    onSuccess: () => {
      setTitle("");
      setContent("");
      setIsExpanded(false);
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      toast.success("Note saved");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to save note"));
    },
  });

  function handleSubmit(event) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    if (!trimmedTitle || !trimmedContent) {
      toast.error("Add a title and content before saving");
      return;
    }

    createNote.mutate({
      title: trimmedTitle,
      content: trimmedContent,
      tags: [],
    });
  }

  return (
    <Card className="mx-auto w-full max-w-2xl shadow-md">
      <CardContent className="p-3">
        <form className="space-y-3" onSubmit={handleSubmit}>
          <Input
            aria-label="Note title"
            className="border-0 text-base font-medium shadow-none focus-visible:ring-0"
            placeholder="Take a note..."
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onFocus={() => setIsExpanded(true)}
          />

          {isExpanded && (
            <>
              <Textarea
                aria-label="Note content"
                className="min-h-[140px] resize-none border-0 shadow-none focus-visible:ring-0"
                placeholder="Write the details here"
                value={content}
                onChange={(event) => setContent(event.target.value)}
              />
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsExpanded(false);
                    setTitle("");
                    setContent("");
                  }}
                >
                  Close
                </Button>
                <Button type="submit" disabled={createNote.isPending}>
                  {createNote.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Save
                </Button>
              </div>
            </>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
