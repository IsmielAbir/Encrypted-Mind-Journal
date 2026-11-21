"use client";

import { useEffect, useState, FormEvent } from "react";
import LogoutButton from "@/components/LogoutButton";

const SUPPORT_STYLES = [
  "Breathing & grounding",
  "Reframing thoughts",
  "Gentle movement",
  "Talking it through",
  "Surprise me",
] as const;

const AVATAR_CHOICES = ["🌿", "🌊", "🌤️", "🌻", "🦋", "🌙", "⭐", "🍃"];

type Profile = {
  email: string;
  displayName: string | null;
  avatarEmoji: string | null;
  bio: string | null;
  preferredSupportStyle: string | null;
  createdAt: string;
  entryCount: number;
  encryptedCount: number;
  noteCount: number;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [avatarEmoji, setAvatarEmoji] = useState("");
  const [bio, setBio] = useState("");
  const [preferredSupportStyle, setPreferredSupportStyle] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json() as Promise<{ profile: Profile }>)
      .then((data) => {
        const p: Profile = data.profile;
        setProfile(p);
        setDisplayName(p.displayName ?? "");
        setAvatarEmoji(p.avatarEmoji ?? "");
        setBio(p.bio ?? "");
        setPreferredSupportStyle(p.preferredSupportStyle ?? "");
      });
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, avatarEmoji, bio, preferredSupportStyle }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not save your profile.");
        return;
      }
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  if (!profile) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <p className="text-foreground/60">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <h1 className="text-2xl font-semibold">Your profile</h1>
      <p className="mt-1 text-sm text-foreground/60">{profile.email}</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4 rounded-lg border border-border bg-card p-5">
        <div className="flex flex-col gap-1 text-sm">
          <span>Avatar</span>
          <div className="flex flex-wrap gap-2">
            {AVATAR_CHOICES.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setAvatarEmoji(emoji)}
                aria-pressed={avatarEmoji === emoji}
                className={`flex h-10 w-10 items-center justify-center rounded-full border text-lg transition ${
                  avatarEmoji === emoji ? "border-accent bg-accent-soft" : "border-border hover:border-accent"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          Display name
          <input
            maxLength={60}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={profile.email}
            className="rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-accent"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Bio
          <textarea
            maxLength={300}
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="A little about you (only visible to you)."
            className="rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-accent"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Preferred support style
          <select
            value={preferredSupportStyle}
            onChange={(e) => setPreferredSupportStyle(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-accent"
          >
            <option value="">No preference</option>
            {SUPPORT_STYLES.map((style) => (
              <option key={style} value={style}>
                {style}
              </option>
            ))}
          </select>
          <span className="text-xs text-foreground/50">
            Used to lean the AI advice on the Journal and Advice pages toward what helps you most.
          </span>
        </label>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        {saved && <p className="text-sm text-accent">Saved.</p>}

        <button
          type="submit"
          disabled={saving}
          className="self-start rounded-md bg-accent px-5 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save profile"}
        </button>
      </form>

      <div className="mt-4 rounded-lg border border-border bg-card p-5">
        <p className="text-sm font-medium">Your data</p>
        <ul className="mt-2 text-sm text-foreground/70">
          <li>
            {profile.entryCount} journal entries ({profile.encryptedCount} encrypted)
          </li>
          <li>{profile.noteCount} quick notes</li>
          <li className="mt-1 text-xs text-foreground/50">
            Account created {new Date(profile.createdAt).toLocaleDateString()}
          </li>
        </ul>
        <p className="mt-3 text-xs text-foreground/50">
          Everything is stored locally in this app&apos;s own database on your machine. Encrypted
          entries use AES-256-GCM with a passphrase that is never stored — keep it safe, it can&apos;t
          be recovered.
        </p>
      </div>

      <div className="mt-6">
        <LogoutButton />
      </div>
    </main>
  );
}
