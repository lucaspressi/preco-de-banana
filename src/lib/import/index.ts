import "server-only";

import { parseProductMessage, type ParsedMessage } from "./parse-message";
import { ScrapeImportProvider } from "./scrape-provider";
import type { ImportResult, ProductImportProvider } from "./types";

export type { ImportResult, ImportedProductData } from "./types";
export type { ParsedMessage } from "./parse-message";

/**
 * Registro de providers, avaliado em ordem.
 *
 * Para adicionar a Amazon PA-API (ou ML / Shopee / Magalu), basta implementar
 * ProductImportProvider e inserir ANTES do scraper - o restante do sistema
 * nao muda.
 */
const providers: ProductImportProvider[] = [
  // new AmazonPaapiProvider(),
  // new MercadoLivreApiProvider(),
  new ScrapeImportProvider(),
];

const ESSENTIAL_FIELDS = ["name", "imageUrl", "currentPrice"] as const;

const FALLBACK_MESSAGE =
  "Nao foi possivel importar todas as informacoes automaticamente. Complete os campos manualmente.";

/**
 * Tenta importar dados publicos de uma URL de produto.
 *
 * Nunca lanca excecao por falha de rede ou bloqueio: retorna um resultado
 * parcial para o admin completar a mao.
 */
export async function importProductFromUrl(
  rawUrl: string,
): Promise<ImportResult> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return {
      success: false,
      data: { foundFields: [] },
      message: "URL invalida.",
      partial: true,
      sourceUrl: rawUrl,
    };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return {
      success: false,
      data: { foundFields: [] },
      message: "Apenas URLs http e https sao aceitas.",
      partial: true,
      sourceUrl: rawUrl,
    };
  }

  const provider = providers.find((p) => p.supports(url));

  if (!provider) {
    return {
      success: false,
      data: { foundFields: [] },
      message: FALLBACK_MESSAGE,
      partial: true,
      sourceUrl: url.toString(),
    };
  }

  try {
    const data = await provider.fetchProduct(url);

    const missing = ESSENTIAL_FIELDS.filter((field) => !data[field]);
    const foundSomething = data.foundFields.length > 0;

    if (!foundSomething) {
      return {
        success: false,
        data,
        message: FALLBACK_MESSAGE,
        partial: true,
        sourceUrl: url.toString(),
      };
    }

    if (missing.length > 0) {
      return {
        success: true,
        data,
        message: `Importacao parcial. Faltou: ${missing
          .map(labelFor)
          .join(", ")}. Complete manualmente antes de salvar.`,
        partial: true,
        sourceUrl: url.toString(),
      };
    }

    return {
      success: true,
      data,
      message: "Dados importados. Revise antes de salvar.",
      partial: false,
      sourceUrl: url.toString(),
    };
  } catch (error) {
    // Bloqueio, timeout, pagina client-side... nada disso deve quebrar o admin.
    const reason =
      error instanceof Error && error.name === "AbortError"
        ? "A loja demorou demais para responder."
        : "A loja bloqueou a leitura automatica ou exige JavaScript.";

    return {
      success: false,
      data: { foundFields: [] },
      message: `${reason} ${FALLBACK_MESSAGE}`,
      partial: true,
      sourceUrl: url.toString(),
    };
  }
}

function labelFor(field: string): string {
  const labels: Record<string, string> = {
    name: "nome",
    imageUrl: "imagem",
    currentPrice: "preco",
  };
  return labels[field] ?? field;
}

export interface MessageImportResult {
  success: boolean;
  data: ParsedMessage;
  message: string;
  partial: boolean;
}

/**
 * Importa a partir do texto colado (mensagem de Telegram/WhatsApp).
 *
 * Mais confiavel que o scraping quando o link e encurtado de afiliado:
 * meli.la, amzn.to e similares costumam redirecionar para perfil ou home,
 * onde nao existe preco algum.
 *
 * Opcionalmente completa a imagem via scraping do link - o unico dado que
 * a mensagem nao traz. Uma falha ali nunca invalida o texto ja extraido.
 */
export async function importProductFromMessage(
  text: string,
  options: { fetchImage?: boolean } = {},
): Promise<MessageImportResult> {
  const data = parseProductMessage(text);

  if (data.foundFields.length === 0) {
    return {
      success: false,
      data,
      message:
        "Nao consegui identificar nenhum dado no texto. Confira se colou a mensagem completa ou preencha manualmente.",
      partial: true,
    };
  }

  // A mensagem quase nunca tem imagem: tenta buscar do link.
  if (options.fetchImage !== false && data.affiliateUrl && !data.imageUrl) {
    try {
      const provider = new ScrapeImportProvider();
      const scraped = await provider.fetchProduct(new URL(data.affiliateUrl));
      if (scraped.imageUrl) {
        data.imageUrl = scraped.imageUrl;
        data.foundFields.push("imageUrl");
      }
      // Nome so e usado se a mensagem nao trouxe um.
      if (!data.name && scraped.name) {
        data.name = scraped.name;
        data.foundFields.push("name");
      }
    } catch {
      // Link bloqueado ou encurtador sem pagina de produto: segue sem imagem.
    }
  }

  const missing: string[] = [];
  if (!data.name) missing.push("nome");
  if (!data.currentPrice) missing.push("preco");
  if (!data.affiliateUrl) missing.push("link");
  if (!data.imageUrl) missing.push("imagem");

  /*
    Desconto: os precos mandam.

    Mensagens costumam anunciar um percentual calculado sobre um preco de
    tabela que nao aparece no texto ("-33%" quando os valores dao 7%).
    O site sempre exibe o percentual derivado dos precos reais, entao
    descartamos o numero da mensagem para o formulario nao mostrar um valor
    que nunca sera usado - e avisamos o porque.
  */
  let warning: string | undefined;
  if (
    data.discountPercentage !== undefined &&
    data.originalPrice !== undefined &&
    data.currentPrice !== undefined &&
    data.originalPrice > data.currentPrice
  ) {
    const real = Math.floor(
      ((data.originalPrice - data.currentPrice) / data.originalPrice) * 100,
    );

    if (Math.abs(real - data.discountPercentage) > 1) {
      warning =
        `A mensagem anuncia ${data.discountPercentage}%, mas os precos dao ` +
        `${real}%. Usando ${real}% - o site calcula sempre pelos precos ` +
        `exibidos.`;
    }

    // Deixa o campo vazio: o site calcula na hora de exibir.
    data.discountPercentage = undefined;
    data.foundFields = data.foundFields.filter(
      (f) => f !== "discountPercentage",
    );
  }

  if (missing.length > 0) {
    return {
      success: true,
      data,
      message:
        `Dados extraidos. Faltou: ${missing.join(", ")}. Complete antes de publicar.` +
        (warning ? ` ${warning}` : ""),
      partial: true,
    };
  }

  return {
    success: true,
    data,
    message: warning
      ? `Dados extraidos. ${warning}`
      : "Tudo extraido da mensagem. Revise e publique.",
    partial: Boolean(warning),
  };
}
