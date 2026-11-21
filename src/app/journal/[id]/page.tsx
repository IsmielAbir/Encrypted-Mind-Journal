"use client";

import { useEffect, useState, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import AdviceBox from "@/components/AdviceBox";

type EntryMeta = {
  id: number;
  title: string;
  mood: string | null;
  createdAt: string;
  updatedAt: string;
  encrypted: boolean;
  content: string | null; // present only when not encrypted
};

export default function EntryDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [entry, setEntry] = useState<EntryMeta | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [content, setContent] = useState<string>("");
  const [unlocked, setUnlocked] = useState(false);
  const [passphrase, setPassphrase] = useState("");
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [decrypting, setDecrypting] = useState(false);

  const [title, setTitle] = useState("");
  const [mood, setMood] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/entries/${id}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json()) as { error?: string };
          throw new Error(body.error ?? "Could not load entry.");
        }
        return res.json() as Promise<EntryMeta>;
      })
      .then((data: EntryMeta) => {
        setEntry(data);
        setTitle(data.title);
        setMood(data.mood ?? "");
        if (!data.encrypted) {
          setContent(data.content ?? "");
          setUnlocked(true);
        }
      })
      .catch((err) => setLoadError(err.message));
  }, [id]);

  async function handleDecrypt(e: FormEvent) {
    e.preventDefault();
    setDecryptError(null);
    setDecrypting(true);
    try {
      const res = await fetch(`/api/entries/${id}/decrypt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passphrase }),
      });
      const data = (await res.json()) as { error?: string; content?: string };
      if (!res.ok) {
        setDecryptError(data.error ?? "Could not decrypt.");
        return;
      }
      setContent(data.content ?? "");
      setUnlocked(true);
    } finally {
      setDecrypting(false);
    }
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaveError(null);
    setSaved(false);
    setSaving(true);
    try {
      const res = await fetch(`/api/entries/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          mood: mood || null,
          content,
          encrypt: entry?.encrypted ?? false,
          passphrase: entry?.encrypted ? passphrase : undefined,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setSaveError(data.error ?? "Could not save changes.");
        return;
      }
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this entry? This cannot be undone.")) return;
    const res = await fetch(`/api/entries/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/journal");
  }

  if (loadError) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <p className="text-red-600 dark:text-red-400">{loadError}</p>
      </main>
    );
  }

  if (!entry) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <p className="text-foreground/60">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{entry.encrypted ? "🔒 " : ""}{entry.title}</h1>
        <button onClick={handleDelete} className="text-sm text-red-600 hover:underline dark:text-red-400">
          Delete
        </button>
      </div>
      <p className="mt-1 text-sm text-foreground/50">
        {new Date(entry.createdAt).toLocaleString("en-US", { timeZone: "UTC" })}
        {entry.mood ? ` · ${entry.mood}` : ""}
      </p>

      {!unlocked ? (
        <form onSubmit={handleDecrypt} className="mt-6 flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-foreground/70">This entry is encrypted. Enter your passphrase to read it.</p>
          <input
            type="password"
            required
            autoFocus
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-accent"
          />
          {decryptError && <p className="text-sm text-red-600 dark:text-red-400">{decryptError}</p>}
          <button
            type="submit"
            disabled={decrypting}
            className="self-start rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {decrypting ? "Decrypting…" : "Unlock"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleSave} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Title
            <input
              required
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-accent"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Mood
            <input
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-accent"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Entry
            <textarea
              required
              rows={12}
              maxLength={20000}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-accent"
            />
          </label>

          <AdviceBox text={content} />

          {saveError && <p className="text-sm text-red-600 dark:text-red-400">{saveError}</p>}
          {saved && <p className="text-sm text-accent">Saved.</p>}

          <button
            type="submit"
            disabled={saving}
            className="self-start rounded-md bg-accent px-5 py-2 font-medium text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>
      )}
    </main>
  );
}
