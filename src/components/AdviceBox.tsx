"use client";

import { useState } from "react";

export default function AdviceBox({ text }: { text: string }) {
  const [advice, setAdvice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    setError(null);
    setAdvice(null);
    try {
      const res = await fetch("/api/advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = (await res.json()) as { error?: string; advice?: string };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setAdvice(data.advice ?? null);
    } catch {
      setError("Could not reach the AI advice service.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-accent-soft bg-accent-soft/40 p-4">
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={handleClick}
          disabled={loading || !text.trim()}
          className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-40"
        >
          {loading ? "Thinking…" : "Get AI advice"}
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {advice && <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{advice}</p>}
    </div>
  );
}
