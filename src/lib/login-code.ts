import "server-only";

import crypto from "node:crypto";

import { prisma } from "@/lib/prisma";

/**
 * Login por codigo enviado ao e-mail.
 *
 * Regras de seguranca:
 * - so e-mails ja cadastrados como admin recebem codigo
 * - a resposta e sempre a mesma, exista o e-mail ou nao (evita descobrir
 *   quais contas existem)
 * - guardamos apenas o hash do codigo
 * - expira em 10 minutos, uso unico, maximo de 5 tentativas
 * - pedir um novo codigo invalida os anteriores
 */

const CODE_LENGTH = 6;
const TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;

/** Codigo numerico gerado com CSPRNG - Math.random seria previsivel. */
function generateCode(): string {
  const max = 10 ** CODE_LENGTH;
  return String(crypto.randomInt(0, max)).padStart(CODE_LENGTH, "0");
}

function hashCode(code: string): string {
  const secret = process.env.AUTH_SECRET ?? "";
  return crypto.createHmac("sha256", secret).update(code).digest("hex");
}

/** Comparacao em tempo constante. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export interface IssueResult {
  /** true quando o e-mail existe e um codigo foi gerado. */
  issued: boolean;
  /** true quando nao ha servico de e-mail e o codigo foi so para o log. */
  loggedOnly: boolean;
}

/**
 * Gera e registra um codigo para o e-mail, se ele pertencer a um admin.
 * O chamador NAO deve revelar `issued` ao usuario.
 */
export async function issueLoginCode(
  rawEmail: string,
): Promise<{ result: IssueResult; code: string | null; email: string }> {
  const email = rawEmail.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    return { result: { issued: false, loggedOnly: false }, code: null, email };
  }

  // Invalida codigos anteriores deste e-mail.
  await prisma.loginToken.deleteMany({ where: { email, usedAt: null } });

  const code = generateCode();

  await prisma.loginToken.create({
    data: {
      email,
      codeHash: hashCode(code),
      expiresAt: new Date(Date.now() + TTL_MINUTES * 60_000),
    },
  });

  return {
    result: { issued: true, loggedOnly: false },
    code,
    email,
  };
}

export interface VerifyResult {
  ok: boolean;
  userId?: string;
  email?: string;
  error?: string;
}

/** Valida o codigo e, em caso de sucesso, marca como usado. */
export async function verifyLoginCode(
  rawEmail: string,
  rawCode: string,
): Promise<VerifyResult> {
  const email = rawEmail.toLowerCase().trim();
  const code = rawCode.replace(/\D/g, "");

  if (code.length !== CODE_LENGTH) {
    return { ok: false, error: "Código inválido ou expirado." };
  }

  const token = await prisma.loginToken.findFirst({
    where: { email, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  if (!token) {
    return { ok: false, error: "Código inválido ou expirado." };
  }

  if (token.attempts >= MAX_ATTEMPTS) {
    await prisma.loginToken.delete({ where: { id: token.id } });
    return {
      ok: false,
      error: "Muitas tentativas. Solicite um novo código.",
    };
  }

  if (!safeEqual(token.codeHash, hashCode(code))) {
    await prisma.loginToken.update({
      where: { id: token.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false, error: "Código inválido ou expirado." };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });

  if (!user) {
    return { ok: false, error: "Código inválido ou expirado." };
  }

  // Uso unico: consumido na primeira validacao bem-sucedida.
  await prisma.loginToken.update({
    where: { id: token.id },
    data: { usedAt: new Date() },
  });

  // Limpeza oportunista dos expirados.
  await prisma.loginToken
    .deleteMany({ where: { expiresAt: { lt: new Date() } } })
    .catch(() => undefined);

  return { ok: true, userId: user.id, email: user.email };
}
