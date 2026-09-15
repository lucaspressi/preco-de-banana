import "server-only";

/**
 * Consumo do feed externo de promocoes (promo.anbu.pro).
 *
 * A API e somente leitura e sem autenticacao. O feed NAO substitui os
 * produtos cadastrados no painel: ele alimenta uma secao propria, para que
 * uma indisponibilidade la fora nunca derrube a home.
 *
 * Configuravel por ambiente:
 *   PROMO_API_URL=https://promo.anbu.pro/api/products
 * Sem essa variavel, a secao simplesmente nao aparece.
 */

export interface PromoProduct {
  id: string;
  title: string;
  price: number | null;
  oldPrice: number | null;
  discountPct: number | null;
  imageUrl: string | null;
  url: string | null;
  category: string | null;
}

const TIMEOUT_MS = 8000;

/** Cache de 10 min: o feed muda com frequencia, mas nao a cada request. */
const REVALIDATE_SECONDS = 600;

function baseUrl(): string | null {
  const raw = process.env.PROMO_API_URL?.trim();
  return raw ? raw.replace(/\/+$/, "") : null;
}

/** Le a primeira chave presente - o payload pode variar de nome. */
function pick(obj: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    const value = obj[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/[^\d.,]/g, "");
  if (!cleaned) return null;
  const normalized =
    cleaned.includes(",") && cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")
      ? cleaned.replace(/\./g, "").replace(",", ".")
      : cleaned.replace(/,/g, "");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function toText(value: unknown): string | null {
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "number") return String(value);
  return null;
}

/** Aceita apenas http/https - bloqueia javascript:, data: etc. */
function safeUrl(value: unknown): string | null {
  const raw = toText(value);
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? parsed.toString()
      : null;
  } catch {
    return null;
  }
}

/**
 * Normaliza um item do feed.
 *
 * Os nomes de campo sao lidos por alternativas porque o contrato da API
 * ainda nao foi verificado em producao - assim uma variacao de nome nao
 * quebra a pagina.
 */
function normalize(raw: unknown): PromoProduct | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;

  const id = toText(pick(item, ["id", "mlb_id", "product_id", "sku", "code"]));
  const title = toText(pick(item, ["title", "name", "produto", "nome"]));
  if (!id || !title) return null;

  const price = toNumber(
    pick(item, ["price", "current_price", "preco", "price_current"]),
  );
  const oldPrice = toNumber(
    pick(item, ["old_price", "original_price", "price_old", "preco_antigo"]),
  );

  let discountPct = toNumber(
    pick(item, ["discount_pct", "discount", "desconto", "discount_percent"]),
  );

  // Desconto derivado dos precos tem prioridade - mesma regra do site:
  // o percentual precisa corresponder aos valores exibidos.
  if (price !== null && oldPrice !== null && oldPrice > price) {
    discountPct = Math.floor(((oldPrice - price) / oldPrice) * 100);
  }

  return {
    id,
    title,
    price,
    oldPrice: oldPrice !== null && price !== null && oldPrice > price ? oldPrice : null,
    discountPct: discountPct !== null && discountPct > 0 ? discountPct : null,
    imageUrl: safeUrl(
      pick(item, ["image_url", "image", "thumbnail", "img", "picture"]),
    ),
    url: safeUrl(
      pick(item, ["url", "permalink", "link", "affiliate_url", "product_url"]),
    ),
    category: toText(pick(item, ["category", "categoria", "category_name"])),
  };
}

export interface PromoFeedOptions {
  limit?: number;
  sort?: "discount" | "price" | "title" | "date";
  minDiscount?: number;
}

/**
 * Busca produtos do feed externo.
 * Nunca lanca: qualquer falha resulta em lista vazia e a secao some.
 */
export async function fetchPromoProducts(
  options: PromoFeedOptions = {},
): Promise<PromoProduct[]> {
  const base = baseUrl();
  if (!base) return [];

  const { limit = 8, sort = "discount", minDiscount } = options;

  const params = new URLSearchParams({
    limit: String(limit),
    sort,
  });
  if (minDiscount !== undefined) {
    params.set("min_discount", String(minDiscount));
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${base}/list?${params}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      next: { revalidate: REVALIDATE_SECONDS, tags: ["promo-feed"] },
    });

    if (!response.ok) {
      console.error(`[promo-feed] HTTP ${response.status}`);
      return [];
    }

    // A API pode devolver HTML numa rota inexistente - nao confiar no status.
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("json")) {
      console.error("[promo-feed] resposta nao e JSON - rota indisponivel?");
      return [];
    }

    const payload: unknown = await response.json();

    const list = Array.isArray(payload)
      ? payload
      : Array.isArray((payload as Record<string, unknown>)?.products)
        ? ((payload as Record<string, unknown>).products as unknown[])
        : Array.isArray((payload as Record<string, unknown>)?.data)
          ? ((payload as Record<string, unknown>).data as unknown[])
          : [];

    return list
      .map(normalize)
      .filter((item): item is PromoProduct => item !== null);
  } catch (error) {
    const reason =
      error instanceof Error && error.name === "AbortError"
        ? "timeout"
        : "falha de rede";
    console.error(`[promo-feed] ${reason}`);
    return [];
  } finally {
    clearTimeout(timer);
  }
}
