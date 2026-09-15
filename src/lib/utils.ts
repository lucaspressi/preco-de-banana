import type { Prisma } from "@/generated/prisma/client";

/** Junta classes condicionalmente (alternativa enxuta ao clsx). */
export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export type PriceLike = Prisma.Decimal | number | string | null | undefined;

export function toNumber(value: PriceLike): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === "number" ? value : Number(value.toString());
  return Number.isFinite(n) ? n : null;
}

export function formatPrice(value: PriceLike): string | null {
  const n = toNumber(value);
  return n === null ? null : BRL.format(n);
}

/**
 * Desconto exibido no site.
 *
 * Quando existem os dois precos, o percentual e SEMPRE calculado a partir
 * deles - mesmo que haja um valor informado manualmente. O que o visitante
 * ve riscado e o que ele paga sao os precos; exibir um percentual que nao
 * corresponde a essa conta e propaganda enganosa (CDC, art. 37), ainda que
 * o numero maior venha da mensagem original da loja.
 *
 * O valor manual so e usado quando nao da para calcular (falta o preco
 * antigo, por exemplo).
 */
export function resolveDiscount(
  originalPrice: PriceLike,
  currentPrice: PriceLike,
  explicit?: number | null,
): number | null {
  const original = toNumber(originalPrice);
  const current = toNumber(currentPrice);

  const canCompute =
    original !== null &&
    current !== null &&
    original > 0 &&
    current > 0 &&
    current < original;

  if (canCompute) {
    /*
      Arredonda para BAIXO de proposito.

      De R$ 399,90 por R$ 249,90 da 37,51%. Exibir "38%" anunciaria um
      desconto maior do que o real. Truncar sempre subestima, nunca exagera.
    */
    const pct = Math.floor(((original - current) / original) * 100);
    return pct > 0 ? pct : null;
  }

  /*
    Se os dois precos existem mas NAO ha desconto real (iguais, ou o atual
    maior), nao exibimos percentual algum - nem o informado manualmente.
    Anunciar desconto onde nao ha e o pior caso possivel.
  */
  if (original !== null && current !== null) return null;

  // Sem os dois precos, resta o valor informado no cadastro.
  if (typeof explicit === "number" && explicit > 0 && explicit < 100) {
    return explicit;
  }

  return null;
}

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function formatDate(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const date = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? null : dateFormatter.format(date);
}

export function isExpired(value: Date | null | undefined): boolean {
  if (!value) return false;
  return value.getTime() <= Date.now();
}

/** Extrai o hostname para exibicao ("www.amazon.com.br" -> "amazon.com.br"). */
export function domainFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}
