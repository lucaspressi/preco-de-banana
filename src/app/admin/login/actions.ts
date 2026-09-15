"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { authenticate, startSession } from "@/lib/auth";
import {
  clientKeyFromHeaders,
  rateLimit,
  resetRateLimit,
} from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validations";

export interface LoginState {
  error?: string;
}

/**
 * Autenticacao do admin.
 *
 * - valida entrada com Zod
 * - limita tentativas por IP (5 a cada 5 minutos)
 * - mensagem generica e tempo de resposta constante: nao revela se o
 *   e-mail existe
 */
export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "E-mail ou senha inválidos." };
  }

  const headerList = await headers();
  const key = clientKeyFromHeaders(headerList, "login");
  const limit = rateLimit(key, 5, 5 * 60 * 1000);

  if (!limit.allowed) {
    const minutes = Math.ceil(limit.retryAfterSeconds / 60);
    return {
      error: `Muitas tentativas. Tente novamente em ${minutes} minuto${
        minutes > 1 ? "s" : ""
      }.`,
    };
  }

  const session = await authenticate(parsed.data.email, parsed.data.password);

  if (!session) {
    return { error: "E-mail ou senha inválidos." };
  }

  resetRateLimit(key);
  await startSession(session);

  const rawNext = formData.get("next");
  // Aceita apenas caminhos internos - evita open redirect.
  const next =
    typeof rawNext === "string" &&
    rawNext.startsWith("/admin") &&
    !rawNext.startsWith("//")
      ? rawNext
      : "/admin";

  redirect(next);
}
