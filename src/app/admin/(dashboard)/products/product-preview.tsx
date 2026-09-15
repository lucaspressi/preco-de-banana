"use client";

import { formatPrice, resolveDiscount } from "@/lib/utils";

interface PreviewProduct {
  name: string;
  imageUrl: string;
  description: string;
  originalPrice: string;
  currentPrice: string;
  discountPercentage: string;
  couponCode: string;
  storeName: string | null;
  isFeatured: boolean;
  isFlashDeal: boolean;
}

/**
 * Previa fiel ao card publico.
 *
 * Usa <img> em vez de next/image de proposito: a URL e digitada em tempo real
 * e pode ser invalida ou de um dominio ainda nao liberado no next.config -
 * o otimizador falharia. Aqui a imagem e apenas ilustrativa.
 */
export function ProductPreview({ product }: { product: PreviewProduct }) {
  const discount = resolveDiscount(
    product.originalPrice || null,
    product.currentPrice || null,
    product.discountPercentage ? Number(product.discountPercentage) : null,
  );

  const originalPrice = formatPrice(product.originalPrice || null);
  const currentPrice = formatPrice(product.currentPrice || null);

  return (
    <article
      className={`flex flex-col overflow-hidden rounded-2xl border bg-white shadow-[var(--shadow-card)] ${
        product.isFlashDeal ? "border-brand-500/70" : "border-slate-200/80"
      }`}
    >
      <div className="relative aspect-square w-full bg-slate-50">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt=""
            className="h-full w-full object-contain p-4"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-slate-400">
            Sem imagem
          </div>
        )}

        <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1.5">
          {product.isFlashDeal && (
            <span className="rounded-full bg-brand-400 px-2.5 py-1 text-[11px] font-bold uppercase text-ink-900">
              ⚡ Relâmpago
            </span>
          )}
          {product.isFeatured && !product.isFlashDeal && (
            <span className="rounded-full bg-brand-600 px-2.5 py-1 text-[11px] font-bold uppercase text-white">
              🔥 Oferta top
            </span>
          )}
        </div>

        {discount !== null && (
          <span className="absolute right-3 top-3 rounded-full bg-danger-500 px-2.5 py-1 text-xs font-bold text-white">
            -{discount}%
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {product.storeName && (
          <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-600">
            {product.storeName}
          </span>
        )}

        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-ink-900">
          {product.name}
        </h3>

        {product.description && (
          <p className="line-clamp-2 text-xs leading-relaxed text-ink-500">
            {product.description}
          </p>
        )}

        <div className="mt-auto pt-2">
          {originalPrice && discount !== null && (
            <p className="text-xs text-slate-400 line-through">
              De: {originalPrice}
            </p>
          )}
          {currentPrice ? (
            <p className="text-xl font-extrabold text-ink-900">
              {currentPrice}
            </p>
          ) : (
            <p className="text-sm font-semibold text-ink-500">
              Ver preço na loja
            </p>
          )}
        </div>

        {product.couponCode && (
          <p className="text-[11px] font-semibold text-brand-700">
            Cupom: <span className="font-mono">{product.couponCode}</span>
          </p>
        )}

        <span
          className={`mt-3 flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold uppercase tracking-wide ${
            product.isFlashDeal
              ? "bg-brand-400 text-ink-900"
              : "bg-brand-600 text-white"
          }`}
        >
          Ver oferta
        </span>
      </div>
    </article>
  );
}
