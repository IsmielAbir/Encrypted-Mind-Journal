import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { requireUser } from "@/lib/auth";
import NavBar from "@/components/NavBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Encrypted Mind Journal — private journaling & CBT-style support",
  description: "A private journaling app with optional encryption, quick notes, and AI-assisted mental health reflection.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NavBar
          user={
            user
              ? { email: user.email, displayName: user.displayName, avatarEmoji: user.avatarEmoji }
              : null
          }
        />
        <div className="flex flex-1 flex-col">{children}</div>
      </body>
    </html>
  );
}
