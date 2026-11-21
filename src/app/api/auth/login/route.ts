import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getPrisma } from "@/lib/db";
import { createSession } from "@/lib/session";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(200),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const prisma = await getPrisma();
  const user = await prisma.user.findUnique({ where: { email } });
  // Generic error on purpose: don't reveal whether the email is registered.
  const genericError = NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  if (!user) return genericError;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return genericError;

  await createSession(user.id, user.email);
  return NextResponse.json({ email: user.email });
}
