import Link from "next/link";
import LogoutButton from "./LogoutButton";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/journal", label: "Journal" },
  { href: "/notes", label: "Quick Notes" },
  { href: "/advice", label: "AI Advice" },
  { href: "/profile", label: "Profile" },
];

type NavUser = { email: string; displayName: string | null; avatarEmoji: string | null };

export default function NavBar({ user }: { user: NavUser | null }) {
  if (!user) return null;

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-3">
        <div className="flex flex-wrap items-center gap-5">
          <Link href="/dashboard" className="text-lg font-semibold text-accent">
            🌿 Encrypted Mind Journal
          </Link>
          <nav className="flex flex-wrap gap-4 text-sm">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="text-foreground/70 hover:text-accent">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/profile" className="hidden items-center gap-2 text-sm text-foreground/70 hover:text-accent sm:flex">
            <span aria-hidden>{user.avatarEmoji ?? "🙂"}</span>
            <span>{user.displayName || user.email}</span>
          </Link>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
