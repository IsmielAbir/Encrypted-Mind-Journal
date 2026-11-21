import { getSession } from "./session";
import { prisma } from "./db";

export async function requireUser() {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  return user;
}
