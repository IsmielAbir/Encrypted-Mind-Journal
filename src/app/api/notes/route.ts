import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getPrisma } from "@/lib/db";

const createNoteSchema = z.object({
  content: z.string().trim().min(1).max(500),
});

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const prisma = await getPrisma();
  const notes = await prisma.note.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ notes });
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = createNoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "A short note can be up to 500 characters." }, { status: 400 });
  }

  const prisma = await getPrisma();
  const note = await prisma.note.create({
    data: { userId: user.id, content: parsed.data.content },
  });
  return NextResponse.json({ note }, { status: 201 });
}
