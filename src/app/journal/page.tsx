import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function JournalListPage() {
  const user = await requireUser();
  if (!user) return null;

  const entries = await prisma.entry.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, mood: true, createdAt: true, encrypted: true, content: true },
  });

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your journal</h1>
        <Link
          href="/journal/new"
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          + New entry
        </Link>
      </div>

      {entries.length === 0 ? (
        <p className="mt-8 text-foreground/60">
          Nothing here yet. <Link href="/journal/new" className="text-accent hover:underline">Write your first entry</Link>.
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {entries.map((entry) => (
            <li key={entry.id}>
              <Link
                href={`/journal/${entry.id}`}
                className="block rounded-lg border border-border bg-card p-4 transition hover:border-accent"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{entry.title}</span>
                  <span className="text-xs text-foreground/50">
                    {new Date(entry.createdAt).toLocaleString()}
                    {entry.mood ? ` · ${entry.mood}` : ""}
                  </span>
                </div>
                <p className="mt-1 truncate text-sm text-foreground/60">
                  {entry.encrypted ? "🔒 Encrypted — enter your passphrase to read" : entry.content.slice(0, 160)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
