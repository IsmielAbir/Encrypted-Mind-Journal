"use client";

import { useEffect, useState, FormEvent } from "react";

type Note = { id: number; content: string; createdAt: string };

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function loadNotes() {
    fetch("/api/notes")
      .then((res) => res.json())
      .then((data) => setNotes(data.notes));
  }

  useEffect(loadNotes, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setContent("");
      loadNotes();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    await fetch(`/api/notes/${id}`, { method: "DELETE" });
    loadNotes();
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <h1 className="text-2xl font-semibold">Quick notes</h1>
      <p className="mt-1 text-sm text-foreground/60">
        For a fleeting thought that doesn&apos;t need a full journal entry — up to 500 characters.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
        <textarea
          required
          maxLength={500}
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Jot it down…"
          className="rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-accent"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-foreground/50">{content.length}/500</span>
          <button
            type="submit"
            disabled={saving || !content.trim()}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Add note"}
          </button>
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      </form>

      <ul className="mt-8 flex flex-col gap-3">
        {notes === null && <p className="text-foreground/60">Loading…</p>}
        {notes?.length === 0 && <p className="text-foreground/60">No quick notes yet.</p>}
        {notes?.map((note) => (
          <li
            key={note.id}
            className="flex items-start justify-between gap-4 rounded-lg border border-border bg-card p-4"
          >
            <div>
              <p className="text-sm">{note.content}</p>
              <p className="mt-1 text-xs text-foreground/50">{new Date(note.createdAt).toLocaleString()}</p>
            </div>
            <button
              onClick={() => handleDelete(note.id)}
              className="shrink-0 text-xs text-red-600 hover:underline dark:text-red-400"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
