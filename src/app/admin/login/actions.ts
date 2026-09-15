"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { startSession } from "@/lib/auth";
import { issueLoginCode, verifyLoginCode } from "@/lib/login-code";
import { sendLoginCode } from "@/lib/mailer";
import {
  clientKeyFromHeaders,
  rateLimit,
  resetRateLimit,
} from "@/lib/rate-limit";
import { loginCodeSchema, loginEmailSchema } from "@/lib/validations";

export interface LoginState {
  step: "email" | "code";
  email?: string;
  error?: string;
  notice?: string;
}

/** Destino interno seguro - evita open redirect. */
function safeNext(raw: FormDataEntryValue | null): string {
  return typeof raw === "string" &&
    raw.startsWith("/admin") &&
    !raw.startsWith("//")
    ? raw
    : "/admin";
}

/**
 * Etapa 1: recebe o e-mail e envia o codigo.
 *
 * A resposta e sempre a mesma, exista ou nao o e-mail - nao permite
 * descobrir quais contas existem.
 */
export async function requestCodeAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginEmailSchema.safeParse({ email: formData.get("email") });

  if (!parsed.success) {
    return { step: "email", error: "Informe um e-mail válido." };
  }

  const headerList = await headers();
  const limit = rateLimit(
    clientKeyFromHeaders(headerList, "login-code"),
    5,
    10 * 60 * 1000,
  );

  if (!limit.allowed) {
    const minutes = Math.ceil(limit.retryAfterSeconds / 60);
    return {
      step: "email",
      error: `Muitas solicitações. Tente novamente em ${minutes} min.`,
    };
  }

  const { result, code, email } = await issueLoginCode(parsed.data.email);

  let loggedOnly = false;
  if (result.issued && code) {
    const sent = await sendLoginCode(email, code);
    loggedOnly = sent.loggedOnly;
  }

  return {
    step: "code",
    email,
    notice: loggedOnly
      ? "Código gerado. O envio por e-mail não está configurado — veja o código nos logs do servidor."
      : "Se este e-mail tiver acesso, enviamos um código. Confira a caixa de entrada.",
  };
}

/** Etapa 2: valida o codigo e abre a sessao. */
export async function verifyCodeAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");

  const parsed = loginCodeSchema.safeParse({
    email,
    code: formData.get("code"),
  });

  if (!parsed.success) {
    return { step: "code", email, error: "Código inválido ou expirado." };
  }

  const headerList = await headers();
  const key = clientKeyFromHeaders(headerList, "login-verify");
  const limit = rateLimit(key, 10, 10 * 60 * 1000);

  if (!limit.allowed) {
    return {
      step: "code",
      email,
      error: "Muitas tentativas. Aguarde alguns minutos.",
    };
  }

  const result = await verifyLoginCode(parsed.data.email, parsed.data.code);

  if (!result.ok || !result.userId || !result.email) {
    return { step: "code", email, error: result.error ?? "Código inválido." };
  }

  resetRateLimit(key);
  await startSession({ userId: result.userId, email: result.email });

  redirect(safeNext(formData.get("next")));
}

/** Volta para a etapa de e-mail. */
export async function restartLoginAction(): Promise<LoginState> {
  return { step: "email" };
}
