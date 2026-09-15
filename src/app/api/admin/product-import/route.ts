import { NextResponse, type NextRequest } from "next/server";

import { requireAdminApi } from "@/lib/admin-guard";
import { importProductFromUrl } from "@/lib/import";
import { clientKeyFromHeaders, rateLimit } from "@/lib/rate-limit";
import { productImportSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";
export const maxDuration = 20;

/**
 * POST /api/admin/product-import
 *
 * Body: { "url": "https://..." }
 *
 * Le metadados publicos da pagina e devolve os campos encontrados.
 * NAO salva nada: o admin revisa e so entao clica em SALVAR PRODUTO.
 */
export async function POST(request: NextRequest) {
  const session = await requireAdminApi();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  // Scraping e caro: limita a 20 importacoes a cada 5 minutos por IP.
  const limit = rateLimit(
    clientKeyFromHeaders(request.headers, "import"),
    20,
    5 * 60 * 1000,
  );

  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: `Muitas importações seguidas. Aguarde ${limit.retryAfterSeconds}s.`,
      },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = productImportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "URL inválida." },
      { status: 400 },
    );
  }

  const result = await importProductFromUrl(parsed.data.url);

  return NextResponse.json(result, { status: 200 });
}
