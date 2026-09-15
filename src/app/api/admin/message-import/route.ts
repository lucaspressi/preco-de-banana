import { NextResponse, type NextRequest } from "next/server";

import { requireAdminApi } from "@/lib/admin-guard";
import { importProductFromMessage } from "@/lib/import";
import { clientKeyFromHeaders, rateLimit } from "@/lib/rate-limit";
import { messageImportSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";
export const maxDuration = 20;

/**
 * POST /api/admin/message-import
 *
 * Body: { "text": "mensagem colada do Telegram/WhatsApp" }
 *
 * Extrai nome, precos, desconto, cupom, link e loja do texto.
 * NAO salva nada: o admin revisa antes de publicar.
 */
export async function POST(request: NextRequest) {
  const session = await requireAdminApi();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const limit = rateLimit(
    clientKeyFromHeaders(request.headers, "msg-import"),
    30,
    5 * 60 * 1000,
  );

  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Muitas importações seguidas. Aguarde ${limit.retryAfterSeconds}s.` },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = messageImportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Texto inválido." },
      { status: 400 },
    );
  }

  const result = await importProductFromMessage(parsed.data.text);

  return NextResponse.json(result, { status: 200 });
}
