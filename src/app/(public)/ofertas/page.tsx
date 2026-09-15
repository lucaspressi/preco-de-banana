import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { EmptyState } from "@/components/empty-state";
import { ProductCard } from "@/components/product-card";
import { ProductFilters } from "@/components/product-filters";
import { SearchBar } from "@/components/search-bar";
import {
  findProducts,
  getActiveCategories,
  getActiveStores,
  type ProductSort,
} from "@/lib/queries";

export const metadata: Metadata = {
  title: "Todas as Ofertas",
  description:
    "Todas as promoções, cupons e produtos selecionados para você economizar.",
  alternates: { canonical: "/ofertas" },
};

export const revalidate = 300;

const PAGE_SIZE = 24;

function parsePrice(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

const VALID_SORTS: ProductSort[] = [
  "recent",
  "discount",
  "price-asc",
  "price-desc",
];

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function OfertasPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const first = (key: string): string | undefined => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const page = Math.max(1, Number(first("page")) || 1);
  const sortParam = first("sort");
  const sort = VALID_SORTS.includes(sortParam as ProductSort)
    ? (sortParam as ProductSort)
    : undefined;

  const [{ items, total }, categories, stores] = await Promise.all([
    findProducts({
      categorySlug: first("categoria"),
      storeSlug: first("loja"),
      search: first("q"),
      minPrice: parsePrice(first("min")),
      maxPrice: parsePrice(first("max")),
      sort,
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    getActiveCategories(),
    getActiveStores(),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const term = first("q");

  const buildPageHref = (target: number) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "string" && key !== "page") next.set(key, value);
    }
    if (target > 1) next.set("page", String(target));
    const query = next.toString();
    return query ? `/ofertas?${query}` : "/ofertas";
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-ink-900 sm:text-4xl">
          {term ? (
            <>
              Resultados para{" "}
              <span className="text-brand-600">&ldquo;{term}&rdquo;</span>
            </>
          ) : (
            <>
              Todas as <span className="text-brand-600">ofertas</span>
            </>
          )}
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          {total === 0
            ? "Nenhum produto encontrado."
            : `${total} ${total === 1 ? "produto encontrado" : "produtos encontrados"}.`}
        </p>

        <div className="mt-5 max-w-xl">
          <Suspense fallback={<div className="h-14" />}>
            <SearchBar />
          </Suspense>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
        <Suspense fallback={<div className="h-64" />}>
          <ProductFilters categories={categories} stores={stores} />
        </Suspense>

        <div>
          {items.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    variant={product.isFlashDeal ? "flash" : "default"}
                    priority={index < 3}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <nav
                  aria-label="Paginação"
                  className="mt-8 flex items-center justify-center gap-2"
                >
                  {page > 1 && (
                    <Link
                      href={buildPageHref(page - 1)}
                      className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-slate-50"
                    >
                      Anterior
                    </Link>
                  )}
                  <span className="px-3 text-sm text-ink-500">
                    Página {page} de {totalPages}
                  </span>
                  {page < totalPages && (
                    <Link
                      href={buildPageHref(page + 1)}
                      className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-slate-50"
                    >
                      Próxima
                    </Link>
                  )}
                </nav>
              )}
            </>
          ) : (
            <EmptyState
              title="Nenhum produto encontrado"
              description={
                term
                  ? "Tente buscar por outro termo ou remover alguns filtros."
                  : "Ajuste os filtros ou volte em breve — novas ofertas entram todos os dias."
              }
              action={
                <Link
                  href="/ofertas"
                  className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white hover:bg-brand-700"
                >
                  Ver todas as ofertas
                </Link>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
