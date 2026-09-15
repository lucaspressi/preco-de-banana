import "server-only";

import { redirect } from "next/navigation";

import { getSession, type SessionPayload } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Exige sessao valida em paginas do admin.
 *
 * Alem de verificar o JWT, confirma que o usuario ainda existe no banco -
 * assim um token roubado deixa de funcionar se o usuario for removido.
 * O proxy (src/proxy.ts) e a primeira barreira; esta e a definitiva.
 */
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true },
  });

  if (!user) redirect("/admin/login");

  return session;
}

/** Versao para route handlers: retorna null em vez de redirecionar. */
export async function requireAdminApi(): Promise<SessionPayload | null> {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true },
  });

  return user ? session : null;
}
