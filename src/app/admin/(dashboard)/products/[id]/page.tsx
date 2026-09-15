import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";

import { ProductForm, type ProductFormValues } from "../product-form";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

/** Converte Date para o formato aceito por <input type="datetime-local">. */
function toDatetimeLocal(date: Date | null): string {
  if (!date) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;

  const [product, categories, stores] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    prisma.store.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  if (!product) notFound();

  const initialValues: ProductFormValues = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description ?? "",
    imageUrl: product.imageUrl ?? "",
    affiliateUrl: product.affiliateUrl,
    originalUrl: product.originalUrl ?? "",
    originalPrice: product.originalPrice?.toString() ?? "",
    currentPrice: product.currentPrice?.toString() ?? "",
    discountPercentage: product.discountPercentage?.toString() ?? "",
    couponCode: product.couponCode ?? "",
    categoryId: product.categoryId ?? "",
    storeId: product.storeId ?? "",
    isFeatured: product.isFeatured,
    isFlashDeal: product.isFlashDeal,
    isActive: product.isActive,
    priority: String(product.priority),
    expiresAt: toDatetimeLocal(product.expiresAt),
  };

  return (
    <div>
      <header className="mb-6">
        <Link
          href="/admin/products"
          className="text-sm font-semibold text-ink-500 hover:text-ink-900"
        >
          ← Voltar para produtos
        </Link>
        <h1 className="mt-2 font-display text-2xl font-extrabold text-ink-900">
          Editar produto
        </h1>
        <a
          href={`/produto/${product.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-block text-sm font-semibold text-brand-700 hover:underline"
        >
          Ver no site ↗
        </a>
      </header>

      <ProductForm
        mode="edit"
        categories={categories}
        stores={stores}
        initialValues={initialValues}
      />
    </div>
  );
}
