import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getPrisma } from "@/lib/db";

export const SUPPORT_STYLES = [
  "Breathing & grounding",
  "Reframing thoughts",
  "Gentle movement",
  "Talking it through",
  "Surprise me",
] as const;

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const prisma = await getPrisma();
  const [entryCount, encryptedCount, noteCount] = await Promise.all([
    prisma.entry.count({ where: { userId: user.id } }),
    prisma.entry.count({ where: { userId: user.id, encrypted: true } }),
    prisma.note.count({ where: { userId: user.id } }),
  ]);

  return NextResponse.json({
    profile: {
      email: user.email,
      displayName: user.displayName,
      avatarEmoji: user.avatarEmoji,
      bio: user.bio,
      preferredSupportStyle: user.preferredSupportStyle,
      createdAt: user.createdAt,
      entryCount,
      encryptedCount,
      noteCount,
    },
  });
}

const updateProfileSchema = z.object({
  displayName: z.string().trim().max(60).optional().or(z.literal("")),
  avatarEmoji: z.string().trim().max(8).optional().or(z.literal("")),
  bio: z.string().trim().max(300).optional().or(z.literal("")),
  preferredSupportStyle: z.enum(SUPPORT_STYLES).optional().or(z.literal("")),
});

export async function PUT(request: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid profile data." },
      { status: 400 },
    );
  }
  const { displayName, avatarEmoji, bio, preferredSupportStyle } = parsed.data;

  const prisma = await getPrisma();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      displayName: displayName || null,
      avatarEmoji: avatarEmoji || null,
      bio: bio || null,
      preferredSupportStyle: preferredSupportStyle || null,
    },
  });

  return NextResponse.json({ ok: true });
}
