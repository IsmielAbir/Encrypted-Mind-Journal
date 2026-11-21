"use client";

import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";
import AdviceBox from "@/components/AdviceBox";

const MOODS = ["😊 Good", "😐 Okay", "😔 Low", "😠 Frustrated", "😟 Anxious", "😴 Tired"];

export default function NewEntryPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [mood, setMood] = useState("");
  const [content, setContent] = useState("");
  const [encrypt, setEncrypt] = useState(false);
  const [passphrase, setPassphrase] = useState("");
  const [confirmPassphrase, setConfirmPassphrase] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (encrypt && passphrase !== confirmPassphrase) {
      setError("Passphrases don't match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          mood: mood || undefined,
          content,
          encrypt,
          passphrase: encrypt ? passphrase : undefined,
        }),
      });
      const data = (await res.json()) as { error?: string; id?: number };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      router.push(`/journal/${data.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <h1 className="text-2xl font-semibold">New journal entry</h1>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Title
          <input
            required
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="A few words about today"
            className="rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-accent"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Mood (optional)
          <select
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-accent"
          >
            <option value="">No mood selected</option>
            {MOODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          What&apos;s on your mind?
          <textarea
            required
            maxLength={20000}
            rows={10}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write freely — this is your space."
            className="rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-accent"
          />
        </label>

        <AdviceBox text={content} />

        <div className="rounded-lg border border-border bg-card p-4">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={encrypt} onChange={(e) => setEncrypt(e.target.checked)} />
            Encrypt this entry
          </label>
          <p className="mt-1 text-xs text-foreground/50">
            Encrypted entries are scrambled with a passphrase only you know. We never store the
            passphrase — if you lose it, the entry can&apos;t be recovered.
          </p>

          {encrypt && (
            <div className="mt-3 flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-sm">
                Passphrase
                <input
                  type="password"
                  required={encrypt}
                  minLength={6}
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  className="rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-accent"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Confirm passphrase
                <input
                  type="password"
                  required={encrypt}
                  value={confirmPassphrase}
                  onChange={(e) => setConfirmPassphrase(e.target.value)}
                  className="rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-accent"
                />
              </label>
            </div>
          )}
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-1 self-start rounded-md bg-accent px-5 py-2 font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save entry"}
        </button>
      </form>
    </main>
  );
}
