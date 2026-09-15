import Image from "next/image";

import type { PromoProduct } from "@/lib/promo-feed";
import { formatPrice } from "@/lib/utils";

/**
 * Ofertas vindas do feed externo.
 *
 * Os links sao de terceiros, entao levam rel="nofollow sponsored noopener".
 * Nao passam por /go/[id]: o tracking interno so vale para produtos do
 * proprio banco.
 */
export function PromoFeedGrid({ products }: { products: PromoProduct[] }) {
  if (products.length === 0) return null;

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((product) => {
        const price = formatPrice(product.price);
        const oldPrice = formatPrice(product.oldPrice);

        return (
          <li key={product.id}>
            <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-card-hover)]">
              <div className="relative aspect-square w-full bg-slate-50">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">
                    Sem imagem
                  </div>
                )}

                {product.discountPct !== null && (
                  <span className="absolute right-3 top-3 rounded-full bg-danger-500 px-2.5 py-1 text-xs font-bold text-white">
                    -{product.discountPct}%
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col gap-2 p-4">
                {product.category && (
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-600">
                    {product.category}
                  </span>
                )}

                <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-ink-900">
                  {product.title}
                </h3>

                <div className="mt-auto pt-2">
                  {oldPrice && (
                    <p className="text-xs text-slate-400 line-through">
                      De: {oldPrice}
                    </p>
                  )}
                  {price ? (
                    <p className="text-xl font-extrabold leading-tight text-ink-900">
                      {price}
                    </p>
                  ) : (
                    <p className="text-sm font-semibold text-ink-500">
                      Ver preço na loja
                    </p>
                  )}
                </div>

                {product.url && (
                  <a
                    href={product.url}
                    target="_blank"
                    rel="nofollow sponsored noopener noreferrer"
                    className="mt-3 flex w-full items-center justify-center rounded-xl bg-brand-400 px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-ink-900 transition-colors hover:bg-brand-500"
                    aria-label={`Ver oferta: ${product.title}`}
                  >
                    Ver oferta
                  </a>
                )}
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
