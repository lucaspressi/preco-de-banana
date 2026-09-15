import * as cheerio from "cheerio";

import type {
  ImportedProductData,
  ProductImportProvider,
} from "./types";

const FETCH_TIMEOUT_MS = 12_000;
const MAX_HTML_BYTES = 3 * 1024 * 1024; // 3 MB

/** Valor arbitrario vindo de JSON-LD de terceiros. */
type JsonValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | JsonValue[]
  | { [key: string]: JsonValue };

type JsonObject = { [key: string]: JsonValue };

function isJsonObject(value: JsonValue): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Provider padrao: le metadados publicos da pagina.
 *
 * Ordem de prioridade (conforme especificado):
 *   1. JSON-LD / schema.org Product
 *   2. Open Graph
 *   3. metatags
 *   4. HTML estruturado
 *
 * Nao tenta contornar CAPTCHA, bloqueio anti-bot ou renderizar JavaScript.
 * Lojas client-side (Shopee, AliExpress) e origens que bloqueiam IPs de
 * datacenter tendem a retornar dados parciais - o admin completa a mao.
 */
export class ScrapeImportProvider implements ProductImportProvider {
  readonly name = "scrape";

  supports(): boolean {
    return true; // fallback universal
  }

  async fetchProduct(url: URL): Promise<ImportedProductData> {
    const html = await this.fetchHtml(url);
    const $ = cheerio.load(html);

    const data: ImportedProductData = { foundFields: [] };

    this.applyJsonLd($, data);
    this.applyOpenGraph($, data);
    this.applyMetaTags($, data);
    this.applyHtmlFallback($, data);

    if (!data.storeName) {
      const host = url.hostname.replace(/^www\./, "");
      data.storeName = this.prettifyHost(host);
      data.foundFields.push("storeName");
    }

    if (data.imageUrl) {
      data.imageUrl = this.absolutize(data.imageUrl, url);
    }

    this.normalizePrices(data);

    return data;
  }

  private async fetchHtml(url: URL): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(url.toString(), {
        signal: controller.signal,
        redirect: "follow",
        headers: {
          // User-Agent honesto de navegador para receber o HTML padrao.
          // Nao ha tentativa de burlar protecoes.
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("html")) {
        throw new Error("A URL nao retornou uma pagina HTML");
      }

      const buffer = await response.arrayBuffer();
      if (buffer.byteLength > MAX_HTML_BYTES) {
        return new TextDecoder().decode(buffer.slice(0, MAX_HTML_BYTES));
      }
      return new TextDecoder().decode(buffer);
    } finally {
      clearTimeout(timer);
    }
  }

  // ---------------------------------------------------------------
  // 1. JSON-LD / schema.org
  // ---------------------------------------------------------------
  private applyJsonLd($: cheerio.CheerioAPI, data: ImportedProductData) {
    const blocks = $('script[type="application/ld+json"]').toArray();

    for (const block of blocks) {
      const raw = $(block).contents().text().trim();
      if (!raw) continue;

      let parsed: JsonValue;
      try {
        parsed = JSON.parse(raw) as JsonValue;
      } catch {
        continue; // JSON-LD malformado e comum - apenas ignora
      }

      const product = this.findProductNode(parsed);
      if (!product) continue;

      this.set(data, "name", this.asText(product.name));
      this.set(data, "description", this.asText(product.description));
      this.set(data, "brand", this.extractBrand(product.brand));

      const image = this.extractImage(product.image);
      this.set(data, "imageUrl", image);

      const offer = this.firstOffer(product.offers);
      if (offer) {
        const price = this.asNumber(offer.price ?? offer.lowPrice);
        this.set(data, "currentPrice", price);
        this.set(data, "currency", this.asText(offer.priceCurrency));

        const seller = offer.seller;
        if (seller !== undefined && isJsonObject(seller)) {
          this.set(data, "storeName", this.asText(seller.name));
        }
      }

      if (data.name && data.currentPrice) break;
    }
  }

  /** Percorre grafos e arrays ate achar um no do tipo Product. */
  private findProductNode(node: JsonValue): JsonObject | null {
    if (!node || typeof node !== "object") return null;

    if (Array.isArray(node)) {
      for (const item of node) {
        const found = this.findProductNode(item);
        if (found) return found;
      }
      return null;
    }

    const obj = node;

    if (Array.isArray(obj["@graph"])) {
      const found = this.findProductNode(obj["@graph"]);
      if (found) return found;
    }

    const type = obj["@type"];
    const types = Array.isArray(type) ? type : [type];
    if (types.some((t) => typeof t === "string" && /product/i.test(t))) {
      return obj;
    }

    return null;
  }

  private firstOffer(offers: JsonValue): JsonObject | null {
    if (!offers) return null;

    if (Array.isArray(offers)) {
      const first = offers[0];
      return first !== undefined && isJsonObject(first) ? first : null;
    }

    if (isJsonObject(offers)) {
      const nested = offers.offers;
      if (Array.isArray(nested)) {
        const first = nested[0];
        return first !== undefined && isJsonObject(first) ? first : null;
      }
      return offers;
    }

    return null;
  }

  private extractBrand(brand: JsonValue): string | undefined {
    if (!brand) return undefined;
    if (typeof brand === "string") return brand;
    if (isJsonObject(brand)) return this.asText(brand.name);
    return undefined;
  }

  private extractImage(image: JsonValue): string | undefined {
    if (!image) return undefined;
    if (typeof image === "string") return image;
    if (Array.isArray(image)) return this.extractImage(image[0]);
    if (isJsonObject(image)) return this.asText(image.url);
    return undefined;
  }

  // ---------------------------------------------------------------
  // 2. Open Graph
  // ---------------------------------------------------------------
  private applyOpenGraph($: cheerio.CheerioAPI, data: ImportedProductData) {
    const og = (property: string) =>
      $(`meta[property="${property}"]`).attr("content")?.trim() ||
      $(`meta[name="${property}"]`).attr("content")?.trim();

    this.set(data, "name", og("og:title"));
    this.set(data, "description", og("og:description"));
    this.set(data, "imageUrl", og("og:image:secure_url") || og("og:image"));
    this.set(data, "storeName", og("og:site_name"));

    this.set(
      data,
      "currentPrice",
      this.asNumber(og("product:price:amount") || og("og:price:amount")),
    );
    this.set(
      data,
      "currency",
      og("product:price:currency") || og("og:price:currency"),
    );
  }

  // ---------------------------------------------------------------
  // 3. metatags genericas
  // ---------------------------------------------------------------
  private applyMetaTags($: cheerio.CheerioAPI, data: ImportedProductData) {
    this.set(
      data,
      "description",
      $('meta[name="description"]').attr("content")?.trim(),
    );
    this.set(
      data,
      "name",
      $('meta[name="twitter:title"]').attr("content")?.trim(),
    );
    this.set(
      data,
      "imageUrl",
      $('meta[name="twitter:image"]').attr("content")?.trim(),
    );
    this.set(
      data,
      "currentPrice",
      this.asNumber($('meta[itemprop="price"]').attr("content")),
    );
  }

  // ---------------------------------------------------------------
  // 4. HTML estruturado
  // ---------------------------------------------------------------
  private applyHtmlFallback($: cheerio.CheerioAPI, data: ImportedProductData) {
    this.set(data, "name", $("h1").first().text().trim());
    this.set(data, "name", $("title").first().text().trim());

    this.set(
      data,
      "currentPrice",
      this.asNumber($('[itemprop="price"]').first().attr("content")),
    );

    if (data.currentPrice === undefined) {
      const candidate = $('[class*="price" i]').first().text();
      this.set(data, "currentPrice", this.parseBrlPrice(candidate));
    }

    if (data.originalPrice === undefined) {
      const struck = $("del, s, [class*='old' i], [class*='from' i]")
        .first()
        .text();
      this.set(data, "originalPrice", this.parseBrlPrice(struck));
    }
  }

  // ---------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------

  /** Grava apenas se ainda vazio - preserva a prioridade das fontes. */
  private set<K extends keyof ImportedProductData>(
    data: ImportedProductData,
    key: K,
    value: ImportedProductData[K] | undefined,
  ) {
    if (value === undefined || value === null || value === "") return;
    if (data[key] !== undefined) return;

    if (typeof value === "string") {
      const clean = value.replace(/\s+/g, " ").trim();
      if (!clean) return;
      data[key] = clean.slice(0, 2000) as ImportedProductData[K];
    } else {
      data[key] = value;
    }

    if (!data.foundFields.includes(key as string)) {
      data.foundFields.push(key as string);
    }
  }

  private asText(value: JsonValue): string | undefined {
    if (typeof value === "string") return value.trim() || undefined;
    if (typeof value === "number") return String(value);
    return undefined;
  }

  private asNumber(value: JsonValue): number | undefined {
    if (typeof value === "number") {
      return Number.isFinite(value) && value > 0 ? value : undefined;
    }
    if (typeof value !== "string") return undefined;

    const cleaned = value.trim().replace(/[^\d.,]/g, "");
    if (!cleaned) return undefined;

    // "1.234,56" (pt-BR) vs "1234.56" (en-US)
    const normalized =
      cleaned.includes(",") && cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")
        ? cleaned.replace(/\./g, "").replace(",", ".")
        : cleaned.replace(/,/g, "");

    const n = Number(normalized);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }

  private parseBrlPrice(text: string | undefined): number | undefined {
    if (!text) return undefined;
    const match = text.match(/(\d{1,3}(?:\.\d{3})*,\d{2}|\d+[.,]\d{2}|\d+)/);
    return match ? this.asNumber(match[1]) : undefined;
  }

  private absolutize(candidate: string, base: URL): string | undefined {
    try {
      const resolved = new URL(candidate, base);
      return resolved.protocol === "http:" || resolved.protocol === "https:"
        ? resolved.toString()
        : undefined;
    } catch {
      return undefined;
    }
  }

  private prettifyHost(host: string): string {
    const known: Record<string, string> = {
      "amazon.com.br": "Amazon",
      "mercadolivre.com.br": "Mercado Livre",
      "magazineluiza.com.br": "Magalu",
      "magalu.com.br": "Magalu",
      "shopee.com.br": "Shopee",
      "aliexpress.com": "AliExpress",
      "pt.aliexpress.com": "AliExpress",
      "kabum.com.br": "KaBuM",
      "americanas.com.br": "Americanas",
      "casasbahia.com.br": "Casas Bahia",
    };
    if (known[host]) return known[host];

    const base = host.split(".")[0] ?? host;
    return base.charAt(0).toUpperCase() + base.slice(1);
  }

  /** Garante coerencia: originalPrice deve ser maior que currentPrice. */
  private normalizePrices(data: ImportedProductData) {
    if (data.originalPrice !== undefined && data.currentPrice !== undefined) {
      if (data.originalPrice <= data.currentPrice) {
        data.originalPrice = undefined;
        data.foundFields = data.foundFields.filter((f) => f !== "originalPrice");
      }
    }
  }
}
