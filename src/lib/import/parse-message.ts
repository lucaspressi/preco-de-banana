import type { ImportedProductData } from "./types";

/**
 * Extrai dados de produto a partir do texto de uma mensagem de divulgacao
 * (Telegram, WhatsApp, etc).
 *
 * Mais confiavel que scraping: o texto ja foi curado por voce e o link ja e
 * o de afiliado. Links encurtados de afiliado (meli.la, amzn.to, ...) muitas
 * vezes nem levam a pagina do produto - redirecionam para perfil ou home -
 * entao ler a mensagem e a unica fonte correta de preco.
 *
 * Formato tipico suportado:
 *
 *   Nome do Produto
 *   💀 R$ 2.469,05          <- preco antigo (riscado)
 *   🏆 R$ 2.279,00 (-33% OFF) <- preco atual + desconto
 *   💳 Em ate 15x de R$ 173,27 sem juros   <- parcelamento (ignorado)
 *   🎟️ CUPOM10              <- cupom
 *   🎮👉 https://...         <- link de afiliado
 *   #Anuncio
 */

export interface ParsedMessage extends ImportedProductData {
  affiliateUrl?: string;
  couponCode?: string;
  discountPercentage?: number;
}

/** Converte "2.469,05" ou "2469.05" em number. */
function parseBrl(raw: string): number | undefined {
  const cleaned = raw.trim().replace(/[^\d.,]/g, "");
  if (!cleaned) return undefined;

  const normalized =
    cleaned.includes(",") && cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")
      ? cleaned.replace(/\./g, "").replace(",", ".")
      : cleaned.replace(/,/g, "");

  const n = Number(normalized);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/** Remove emojis e simbolos decorativos das pontas. */
function stripDecorations(line: string): string {
  return line
    .replace(
      /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}]/gu,
      "",
    )
    .replace(/\s+/g, " ")
    .trim();
}

const PRICE_RE = /R\$\s*([\d.,]+)/gi;

/** Linhas de parcelamento nao contem o preco do produto. */
const INSTALLMENT_RE =
  /\b(\d+\s*x\b|em\s+at[ée]\s+\d|sem\s+juros|parcel|no\s+cart[ãa]o|juros)/i;

/** Marcadores comuns de preco "de/por". */
const OLD_PRICE_HINT = /(de:|de\s+r\$|antes|antigo|\bde\b)/i;
const NEW_PRICE_HINT = /(por:|por\s+r\$|agora|hoje|apenas)/i;

const COUPON_LABEL_RE =
  /(?:cupom|cupon|coupon|c[óo]digo|code|voucher)\s*:?\s*([A-Z0-9][A-Z0-9._-]{2,30})/i;

/** Cupom em linha propria: token isolado em CAIXA ALTA. */
const BARE_COUPON_RE = /^([A-Z][A-Z0-9._-]{3,30})$/;

const URL_RE = /https?:\/\/[^\s<>"')\]]+/gi;

const DISCOUNT_RE = /-?\s*(\d{1,2})\s*%\s*(?:off|de\s+desconto|desconto)?/i;

/** Palavras que nunca sao nome de produto. */
const NOISE_LINE =
  /^(#|@|https?:|www\.|an[úu]ncio|promo(?:c[ãa]o)?$|oferta$|link|compre|clique|acesse|aproveite|corre|v[áa])/i;

/** Domínios de encurtador/afiliado mapeados para a loja real. */
const AFFILIATE_HOSTS: Record<string, string> = {
  "meli.la": "Mercado Livre",
  "mercadolivre.com.br": "Mercado Livre",
  "mercadolivre.com": "Mercado Livre",
  "amzn.to": "Amazon",
  "amazon.com.br": "Amazon",
  "amazon.com": "Amazon",
  "magazinevoce.com.br": "Magalu",
  "magazineluiza.com.br": "Magalu",
  "magalu.com": "Magalu",
  "shopee.com.br": "Shopee",
  "s.shopee.com.br": "Shopee",
  "shope.ee": "Shopee",
  "aliexpress.com": "AliExpress",
  "s.click.aliexpress.com": "AliExpress",
  "pt.aliexpress.com": "AliExpress",
  "kabum.com.br": "KaBuM",
  "americanas.com.br": "Americanas",
  "casasbahia.com.br": "Casas Bahia",
  "pontofrio.com.br": "Ponto",
  "terabyteshop.com.br": "Terabyte",
  "pichau.com.br": "Pichau",
};

function storeFromUrl(url: string): string | undefined {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    if (AFFILIATE_HOSTS[host]) return AFFILIATE_HOSTS[host];

    // Tenta casar por sufixo (ex.: "produto.mercadolivre.com.br")
    for (const [domain, name] of Object.entries(AFFILIATE_HOSTS)) {
      if (host === domain || host.endsWith(`.${domain}`)) return name;
    }
  } catch {
    // URL invalida - ignora
  }
  return undefined;
}

/**
 * Interpreta o texto colado e devolve os campos encontrados.
 * Nunca lanca excecao: o que nao for reconhecido fica para preenchimento
 * manual.
 */
export function parseProductMessage(input: string): ParsedMessage {
  const data: ParsedMessage = { foundFields: [] };

  const text = (input ?? "").replace(/\r\n/g, "\n").trim();
  if (!text) return data;

  const rawLines = text.split("\n");
  const found = new Set<string>();

  // ---------------------------------------------------------------
  // 1. Link de afiliado (primeiro http encontrado)
  // ---------------------------------------------------------------
  const urls = text.match(URL_RE) ?? [];
  const firstUrl = urls[0];
  if (firstUrl) {
    // Remove pontuacao que costuma grudar no fim do link.
    const url = firstUrl.replace(/[.,;:!?)]+$/, "");
    data.affiliateUrl = url;
    found.add("affiliateUrl");

    const store = storeFromUrl(url);
    if (store) {
      data.storeName = store;
      found.add("storeName");
    }
  }

  // ---------------------------------------------------------------
  // 2. Precos
  //
  // Estrategia: coleta todos os "R$ X" que NAO estejam em linha de
  // parcelamento. O maior vira preco antigo e o menor, preco atual -
  // salvo quando a propria linha indica "de"/"por".
  // ---------------------------------------------------------------
  interface Candidate {
    value: number;
    isOld: boolean;
    isNew: boolean;
    order: number;
  }

  const candidates: Candidate[] = [];
  let order = 0;

  for (const rawLine of rawLines) {
    const line = stripDecorations(rawLine);
    if (!line) continue;

    // Parcelamento ("15x de R$ 173,27") nunca e o preco do produto.
    if (INSTALLMENT_RE.test(line)) continue;

    PRICE_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = PRICE_RE.exec(line)) !== null) {
      const value = parseBrl(match[1]);
      if (value === undefined) continue;

      candidates.push({
        value,
        isOld: OLD_PRICE_HINT.test(line),
        isNew: NEW_PRICE_HINT.test(line),
        order: order++,
      });
    }
  }

  if (candidates.length === 1) {
    data.currentPrice = candidates[0].value;
    found.add("currentPrice");
  } else if (candidates.length >= 2) {
    const explicitOld = candidates.find((c) => c.isOld && !c.isNew);
    const explicitNew = candidates.find((c) => c.isNew && !c.isOld);

    if (explicitOld && explicitNew) {
      data.originalPrice = explicitOld.value;
      data.currentPrice = explicitNew.value;
    } else {
      // Sem marcadores: maior = antigo, menor = atual.
      const sorted = [...candidates].sort((a, b) => b.value - a.value);
      data.originalPrice = sorted[0].value;
      data.currentPrice = sorted[sorted.length - 1].value;
    }

    // Coerencia: precos iguais nao configuram desconto.
    if (
      data.originalPrice !== undefined &&
      data.currentPrice !== undefined &&
      data.originalPrice <= data.currentPrice
    ) {
      data.originalPrice = undefined;
    }

    if (data.originalPrice !== undefined) found.add("originalPrice");
    if (data.currentPrice !== undefined) found.add("currentPrice");
  }

  // ---------------------------------------------------------------
  // 3. Desconto explicito na mensagem
  // ---------------------------------------------------------------
  const discountMatch = text.match(DISCOUNT_RE);
  if (discountMatch) {
    const pct = Number(discountMatch[1]);
    if (pct > 0 && pct < 100) {
      data.discountPercentage = pct;
      found.add("discountPercentage");
    }
  }

  // ---------------------------------------------------------------
  // 4. Cupom
  // ---------------------------------------------------------------
  const labeled = text.match(COUPON_LABEL_RE);
  if (labeled) {
    data.couponCode = labeled[1].toUpperCase();
    found.add("couponCode");
  } else {
    // Sem rotulo: procura linha isolada em CAIXA ALTA que nao seja
    // preco, hashtag, URL nem o proprio nome do produto.
    for (const rawLine of rawLines) {
      const line = stripDecorations(rawLine);
      if (!line || line.length > 32) continue;
      if (/R\$|https?:|^#|^\d/.test(line)) continue;
      if (/\s/.test(line)) continue; // cupom nao tem espaco

      const m = line.match(BARE_COUPON_RE);
      if (m && /\d/.test(m[1]) === false && m[1].length < 6) continue;
      if (m) {
        data.couponCode = m[1].toUpperCase();
        found.add("couponCode");
        break;
      }
    }
  }

  // ---------------------------------------------------------------
  // 5. Nome do produto
  //
  // Primeira linha util: sem preco, sem URL, sem hashtag e com tamanho
  // razoavel de titulo.
  // ---------------------------------------------------------------
  for (const rawLine of rawLines) {
    const line = stripDecorations(rawLine);
    if (!line || line.length < 8) continue;
    if (NOISE_LINE.test(line)) continue;
    if (/R\$/.test(line)) continue;
    if (URL_RE.test(line)) {
      URL_RE.lastIndex = 0;
      continue;
    }
    URL_RE.lastIndex = 0;
    if (data.couponCode && line.toUpperCase() === data.couponCode) continue;

    data.name = line.slice(0, 200);
    found.add("name");
    break;
  }

  data.foundFields = [...found];
  return data;
}
