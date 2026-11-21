import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getJournalAdvice, PollinationsError } from "@/lib/pollinations";

const adviceSchema = z.object({
  text: z.string().trim().min(1).max(4000),
});

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = adviceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Write something first (up to 4000 characters)." }, { status: 400 });
  }

  try {
    const advice = await getJournalAdvice(parsed.data.text, user.preferredSupportStyle);
    return NextResponse.json({ advice });
  } catch (err) {
    if (err instanceof PollinationsError) {
      return NextResponse.json({ error: err.message }, { status: err.status === 402 ? 429 : 502 });
    }
    return NextResponse.json({ error: "Something went wrong getting advice." }, { status: 500 });
  }
}
