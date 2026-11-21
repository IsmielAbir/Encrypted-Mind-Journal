import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getPrisma } from "@/lib/db";
import { decryptContent } from "@/lib/crypto";

const decryptSchema = z.object({ passphrase: z.string().min(1).max(200) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const prisma = await getPrisma();
  const id = Number((await params).id);
  const entry = await prisma.entry.findUnique({ where: { id } });
  if (!entry || entry.userId !== user.id) {
    return NextResponse.json({ error: "Entry not found." }, { status: 404 });
  }
  if (!entry.encrypted || !entry.salt || !entry.iv || !entry.authTag) {
    return NextResponse.json({ error: "This entry is not encrypted." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = decryptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter the passphrase." }, { status: 400 });
  }

  try {
    const content = decryptContent(
      { ciphertext: entry.content, salt: entry.salt, iv: entry.iv, authTag: entry.authTag },
      parsed.data.passphrase,
    );
    return NextResponse.json({ content });
  } catch {
    return NextResponse.json({ error: "Incorrect passphrase." }, { status: 403 });
  }
}
