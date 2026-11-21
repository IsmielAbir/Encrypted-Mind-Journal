import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getPrisma } from "@/lib/db";
import { encryptContent } from "@/lib/crypto";

const createEntrySchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    mood: z.string().trim().max(50).optional(),
    content: z.string().min(1).max(20000),
    encrypt: z.boolean(),
    passphrase: z.string().min(6).max(200).optional(),
  })
  .refine((data) => !data.encrypt || !!data.passphrase, {
    message: "A passphrase of at least 6 characters is required to encrypt an entry.",
    path: ["passphrase"],
  });

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const prisma = await getPrisma();
  const entries = await prisma.entry.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      mood: true,
      createdAt: true,
      updatedAt: true,
      encrypted: true,
      content: true,
    },
  });

  const list = entries.map((e) => ({
    id: e.id,
    title: e.title,
    mood: e.mood,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
    encrypted: e.encrypted,
    preview: e.encrypted ? null : e.content.slice(0, 160),
  }));

  return NextResponse.json({ entries: list });
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = createEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid entry." },
      { status: 400 },
    );
  }
  const { title, mood, content, encrypt, passphrase } = parsed.data;

  const data = encrypt
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

  const prisma = await getPrisma();
  const entry = await prisma.entry.create({
    data: {
      userId: user.id,
      title,
      mood: mood || null,
      ...data,
    },
  });

  return NextResponse.json({ id: entry.id }, { status: 201 });
}
