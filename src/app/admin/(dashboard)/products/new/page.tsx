import Link from "next/link";

import { prisma } from "@/lib/prisma";

import { ProductForm } from "../product-form";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const [categories, stores] = await Promise.all([
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
          Adicionar produto
        </h1>
      </header>

      <ProductForm mode="create" categories={categories} stores={stores} />
    </div>
  );
}
