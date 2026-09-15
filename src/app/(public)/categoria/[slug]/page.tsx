import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { EmptyState } from "@/components/empty-state";
import { ProductCard } from "@/components/product-card";
import { ProductFilters } from "@/components/product-filters";
import {
  findProducts,
  getActiveStores,
  getCategoryBySlug,
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
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true },
    });
    return categories.map((category) => ({ slug: category.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) return { title: "Categoria não encontrada" };

  return {
    title: `${category.name} — Ofertas`,
    description:
      category.description ??
      `As melhores ofertas de ${category.name} selecionadas para você.`,
    alternates: { canonical: `/categoria/${category.slug}` },
    openGraph: {
      title: `${category.name} — Ofertas`,
      description: category.description ?? undefined,
      type: "website",
    },
  };
}

const VALID_SORTS: ProductSort[] = [
  "recent",
  "discount",
  "price-asc",
  "price-desc",
];

export default async function CategoriaPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const query = await searchParams;

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const first = (key: string): string | undefined => {
    const value = query[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const sortParam = first("sort");
  const sort = VALID_SORTS.includes(sortParam as ProductSort)
    ? (sortParam as ProductSort)
    : undefined;

  const [{ items, total }, stores] = await Promise.all([
    findProducts({
      categorySlug: slug,
      storeSlug: first("loja"),
      sort,
      take: 48,
    }),
    getActiveStores(),
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
        <span className="font-semibold text-ink-900">{category.name}</span>
      </nav>

      <header className="mb-8">
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-ink-900 sm:text-4xl">
          {category.name}
        </h1>
        {category.description && (
          <p className="mt-2 max-w-2xl text-sm text-ink-500 sm:text-base">
            {category.description}
          </p>
        )}
        <p className="mt-1 text-sm text-ink-500">
          {total} {total === 1 ? "produto" : "produtos"}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
        <Suspense fallback={<div className="h-64" />}>
          <ProductFilters categories={[]} stores={stores} hideCategory />
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
              title="Ainda não há produtos nesta categoria"
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
