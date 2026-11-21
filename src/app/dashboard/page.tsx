import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getPrisma } from "@/lib/db";

export default async function DashboardPage() {
  const user = await requireUser();
  if (!user) return null; // middleware already redirects unauthenticated visitors

  const prisma = await getPrisma();
  const [entryCount, noteCount, recentEntries, recentNotes] = await Promise.all([
    prisma.entry.count({ where: { userId: user.id } }),
    prisma.note.count({ where: { userId: user.id } }),
    prisma.entry.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, title: true, mood: true, createdAt: true, encrypted: true, content: true },
    }),
    prisma.note.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <h1 className="text-2xl font-semibold">
        {user.avatarEmoji ? `${user.avatarEmoji} ` : ""}Welcome back{user.displayName ? `, ${user.displayName}` : ""}
      </h1>
      <p className="mt-1 text-foreground/60">{user.email}</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/journal/new"
          className="rounded-xl border border-border bg-card p-5 transition hover:border-accent"
        >
          <p className="text-sm text-foreground/60">New entry</p>
          <p className="mt-1 text-lg font-medium">Write in your journal →</p>
        </Link>
        <Link href="/notes" className="rounded-xl border border-border bg-card p-5 transition hover:border-accent">
          <p className="text-sm text-foreground/60">{noteCount} quick notes</p>
          <p className="mt-1 text-lg font-medium">Jot a short note →</p>
        </Link>
        <Link href="/advice" className="rounded-xl border border-border bg-card p-5 transition hover:border-accent">
          <p className="text-sm text-foreground/60">Feeling stressed?</p>
          <p className="mt-1 text-lg font-medium">Get AI-assisted advice →</p>
        </Link>
      </div>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent entries ({entryCount} total)</h2>
          <Link href="/journal" className="text-sm text-accent hover:underline">
            View all
          </Link>
        </div>
        {recentEntries.length === 0 ? (
          <p className="mt-3 text-sm text-foreground/60">
            No entries yet. <Link href="/journal/new" className="text-accent hover:underline">Write your first one</Link>.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {recentEntries.map((entry) => (
              <li key={entry.id}>
                <Link
                  href={`/journal/${entry.id}`}
                  className="block rounded-lg border border-border bg-card p-4 transition hover:border-accent"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{entry.title}</span>
                    <span className="text-xs text-foreground/50">
                      {new Date(entry.createdAt).toLocaleDateString()}
                      {entry.mood ? ` · ${entry.mood}` : ""}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm text-foreground/60">
                    {entry.encrypted ? "🔒 Encrypted entry" : entry.content.slice(0, 120)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent quick notes</h2>
          <Link href="/notes" className="text-sm text-accent hover:underline">
            View all
          </Link>
        </div>
        {recentNotes.length === 0 ? (
          <p className="mt-3 text-sm text-foreground/60">No quick notes yet.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {recentNotes.map((note) => (
              <li key={note.id} className="rounded-lg border border-border bg-card p-3 text-sm">
                {note.content}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
