import { z } from "zod";

/**
 * Validacao das variaveis de ambiente do servidor.
 *
 * Falha rapido no boot quando algo essencial esta faltando, em vez de
 * quebrar silenciosamente em runtime.
 *
 * ADMIN_EMAIL / ADMIN_PASSWORD NAO aparecem aqui de proposito: sao lidas
 * apenas pelo script de seed, nunca pela aplicacao em execucao.
 */
const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL e obrigatoria"),
  AUTH_SECRET: z
    .string()
    .min(32, "AUTH_SECRET precisa ter ao menos 32 caracteres"),
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | null = null;

export function getEnv(): ServerEnv {
  if (cached) return cached;

  const parsed = serverEnvSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NODE_ENV: process.env.NODE_ENV,
  });

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Variaveis de ambiente invalidas:\n${issues}\n\nConsulte o .env.example.`,
    );
  }

  cached = parsed.data;
  return cached;
}

/** URL publica do site, sem barra final. */
export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

export const isProduction = () => process.env.NODE_ENV === "production";
