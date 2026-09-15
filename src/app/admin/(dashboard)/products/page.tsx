import Link from "next/link";

import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { prisma } from "@/lib/prisma";
import { formatPrice, resolveDiscount } from "@/lib/utils";

import { deleteProductAction, toggleProductFlagAction } from "./actions";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function FlagButton({
  id,
  field,
  active,
  label,
}: {
  id: string;
  field: string;
  active: boolean;
  label: string;
}) {
  return (
    <form action={toggleProductFlagAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="field" value={field} />
      <button
        type="submit"
        aria-pressed={active}
        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide transition-colors ${
          active
            ? "bg-brand-600 text-white hover:bg-brand-700"
            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
        }`}
      >
        {label}
      </button>
    </form>
  );
}

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const flashOnly = params.flash === "1";

  const products = await prisma.product.findMany({
    where: flashOnly ? { isFlashDeal: true } : undefined,
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      imageUrl: true,
      originalPrice: true,
      currentPrice: true,
      discountPercentage: true,
      isActive: true,
      isFeatured: true,
      isFlashDeal: true,
      priority: true,
      store: { select: { name: true } },
      category: { select: { name: true } },
      _count: { select: { clicks: true } },
    },
  });

  const notice = params.created
    ? "Produto publicado."
    : params.updated
      ? "Alterações salvas."
      : params.deleted
        ? "Produto excluído."
        : null;

  return (
    <div>
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink-900">
            Produtos
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            {products.length} {products.length === 1 ? "produto" : "produtos"}
            {flashOnly && " (apenas relâmpago)"}
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="inline-flex justify-center rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold uppercase tracking-wide text-white hover:bg-brand-700"
        >
          + Adicionar produto
        </Link>
      </header>

      {notice && (
        <p
          role="status"
          className="mb-5 rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-800"
        >
          {notice}
        </p>
      )}

      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <p className="text-base font-bold text-ink-900">
            Nenhum produto cadastrado
          </p>
          <p className="mt-1 text-sm text-ink-500">
            Cadastre o primeiro produto colando o link da loja.
          </p>
          <Link
            href="/admin/products/new"
            className="mt-5 inline-flex rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold uppercase tracking-wide text-white hover:bg-brand-700"
          >
            + Adicionar produto
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {products.map((product) => {
            const discount = resolveDiscount(
              product.originalPrice,
              product.currentPrice,
              product.discountPercentage,
            );
            const price = formatPrice(product.currentPrice);

            return (
              <li
                key={product.id}
                className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[var(--shadow-card)]"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="flex min-w-0 flex-1 gap-3">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-50">
                      {product.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.imageUrl}
                          alt=""
                          className="h-full w-full object-contain p-1"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] text-slate-400">
                          sem foto
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-sm font-bold text-ink-900">
                        {product.name}
                      </h2>
                      <p className="mt-0.5 truncate text-xs text-ink-500">
                        {[
                          product.store?.name,
                          product.category?.name,
                          price,
                          discount !== null ? `-${discount}%` : null,
                        ]
                          .filter(Boolean)
                          .join(" • ")}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        Prioridade {product.priority} •{" "}
                        {product._count.clicks}{" "}
                        {product._count.clicks === 1 ? "clique" : "cliques"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <FlagButton
                      id={product.id}
                      field="isActive"
                      active={product.isActive}
                      label={product.isActive ? "Ativo" : "Inativo"}
                    />
                    <FlagButton
                      id={product.id}
                      field="isFeatured"
                      active={product.isFeatured}
                      label="Destaque"
                    />
                    <FlagButton
                      id={product.id}
                      field="isFlashDeal"
                      active={product.isFlashDeal}
                      label="Relâmpago"
                    />

                    <Link
                      href={`/admin/products/${product.id}`}
                      className="rounded-lg bg-slate-100 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-700 hover:bg-slate-200"
                    >
                      Editar
                    </Link>

                    <form action={deleteProductAction}>
                      <input type="hidden" name="id" value={product.id} />
                      <ConfirmSubmitButton
                        message={`Excluir "${product.name}"? Esta ação não pode ser desfeita.`}
                        className="rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-red-600 hover:bg-red-50"
                      >
                        Excluir
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
