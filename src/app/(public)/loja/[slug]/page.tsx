import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { EmptyState } from "@/components/empty-state";
import { ProductCard } from "@/components/product-card";
import { ProductFilters } from "@/components/product-filters";
import {
  findProducts,
  getActiveCategories,
  getStoreBySlug,
  type ProductSort,
} from "@/lib/queries";
import { prisma } from "@/lib/prisma";

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateStaticParams() {
  try {
    const stores = await prisma.store.findMany({
      where: { isActive: true },
      select: { slug: true },
    });
    return stores.map((store) => ({ slug: store.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);

  if (!store) return { title: "Loja não encontrada" };

  return {
    title: `Ofertas ${store.name}`,
    description: `As melhores promoções e cupons da ${store.name}.`,
    alternates: { canonical: `/loja/${store.slug}` },
  };
}

const VALID_SORTS: ProductSort[] = [
  "recent",
  "discount",
  "price-asc",
  "price-desc",
];

export default async function LojaPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const query = await searchParams;

  const store = await getStoreBySlug(slug);
  if (!store) notFound();

  const first = (key: string): string | undefined => {
    const value = query[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const sortParam = first("sort");
  const sort = VALID_SORTS.includes(sortParam as ProductSort)
    ? (sortParam as ProductSort)
    : undefined;

  const [{ items, total }, categories] = await Promise.all([
    findProducts({
      storeSlug: slug,
      categorySlug: first("categoria"),
      sort,
      take: 48,
    }),
    getActiveCategories(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <nav aria-label="Você está aqui" className="mb-4 text-sm text-ink-500">
        <Link href="/" className="hover:text-brand-700">
          Início
        </Link>
        <span aria-hidden="true" className="mx-2 text-slate-300">
          /
        </span>
        <span className="font-semibold text-ink-900">{store.name}</span>
      </nav>

      <header className="mb-8">
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-ink-900 sm:text-4xl">
          Ofertas <span className="text-brand-600">{store.name}</span>
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          {total} {total === 1 ? "produto" : "produtos"}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
        <Suspense fallback={<div className="h-64" />}>
          <ProductFilters categories={categories} stores={[]} hideStore />
        </Suspense>

        <div>
          {items.length > 0 ? (
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
          ) : (
            <EmptyState
              title={`Ainda não há ofertas da ${store.name}`}
              description="Novas ofertas entram todos os dias — volte em breve."
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
