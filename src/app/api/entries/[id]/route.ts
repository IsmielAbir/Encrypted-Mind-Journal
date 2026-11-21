import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { encryptContent } from "@/lib/crypto";

async function loadOwnedEntry(id: number, userId: number) {
  const entry = await prisma.entry.findUnique({ where: { id } });
  if (!entry || entry.userId !== userId) return null;
  return entry;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const id = Number((await params).id);
  const entry = await loadOwnedEntry(id, user.id);
  if (!entry) return NextResponse.json({ error: "Entry not found." }, { status: 404 });

  return NextResponse.json({
    id: entry.id,
    title: entry.title,
    mood: entry.mood,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    encrypted: entry.encrypted,
    // Plaintext entries return content directly. Encrypted entries only
    // reveal content through POST /api/entries/[id]/decrypt with the passphrase.
    content: entry.encrypted ? null : entry.content,
  });
}

const updateEntrySchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    mood: z.string().trim().max(50).nullable().optional(),
    content: z.string().min(1).max(20000).optional(),
    encrypt: z.boolean().optional(),
    passphrase: z.string().min(6).max(200).optional(),
  })
  .refine((data) => !data.content || !data.encrypt || !!data.passphrase, {
    message: "A passphrase of at least 6 characters is required to save an encrypted entry.",
    path: ["passphrase"],
  });

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const id = Number((await params).id);
  const entry = await loadOwnedEntry(id, user.id);
  if (!entry) return NextResponse.json({ error: "Entry not found." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = updateEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid update." },
      { status: 400 },
    );
  }
  const { title, mood, content, encrypt, passphrase } = parsed.data;

  const contentUpdate =
    content === undefined
      ? {}
      : encrypt
        ? (() => {
            const payload = encryptContent(content, passphrase!);
            return {
              encrypted: true,
              content: payload.ciphertext,
              salt: payload.salt,
              iv: payload.iv,
              authTag: payload.authTag,
            };
          })()
        : { encrypted: false, content, salt: null, iv: null, authTag: null };

  await prisma.entry.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(mood !== undefined ? { mood: mood || null } : {}),
      ...contentUpdate,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const id = Number((await params).id);
  const entry = await loadOwnedEntry(id, user.id);
  if (!entry) return NextResponse.json({ error: "Entry not found." }, { status: 404 });

  await prisma.entry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
