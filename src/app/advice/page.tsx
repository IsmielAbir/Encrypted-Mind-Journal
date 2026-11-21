"use client";

import { useState } from "react";
import AdviceBox from "@/components/AdviceBox";

export default function AdvicePage() {
  const [text, setText] = useState("");

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <h1 className="text-2xl font-semibold">AI-assisted advice</h1>

      <div className="mt-6 flex flex-col gap-4">
        <textarea
          rows={8}
          maxLength={4000}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. I have a big deadline tomorrow and I can't stop worrying about it…"
          className="rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-accent"
        />
        <AdviceBox text={text} />
      </div>
    </main>
  );
}
