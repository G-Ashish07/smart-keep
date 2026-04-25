import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { api, getApiErrorMessage } from "../lib/api";
import NoteCard from "./NoteCard";

export default function NotesGrid() {
  const notesQuery = useQuery({
    queryKey: ["notes"],
    queryFn: async () => {
      const response = await api.get("/api/notes");
      return response.data;
    },
  });

  useEffect(() => {
    if (notesQuery.isError) {
      toast.error(getApiErrorMessage(notesQuery.error, "Unable to load notes"));
    }
  }, [notesQuery.error, notesQuery.isError]);

  if (notesQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading notes
      </div>
    );
  }

  if (notesQuery.isError) {
    return (
      <div className="rounded-lg border border-dashed bg-card px-6 py-12 text-center text-sm text-muted-foreground">
        Notes could not be loaded.
      </div>
    );
  }

  const notes = notesQuery.data || [];

  if (notes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-card px-6 py-16 text-center">
        <FileText className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <p className="font-medium">No notes yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Create your first note and it will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} />
      ))}
    </div>
  );
}
