import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const id = Number((await params).id);
  const note = await prisma.note.findUnique({ where: { id } });
  if (!note || note.userId !== user.id) {
    return NextResponse.json({ error: "Note not found." }, { status: 404 });
  }

  await prisma.note.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
