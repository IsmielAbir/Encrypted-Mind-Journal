import { getSession } from "./session";
import { getPrisma } from "./db";

export async function requireUser() {
  const session = await getSession();
  if (!session) return null;

  const prisma = await getPrisma();
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  return user;
}
