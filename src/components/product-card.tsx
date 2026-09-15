import Image from "next/image";
import Link from "next/link";

import { CountdownBadge } from "@/components/countdown-badge";
import type { ProductCard as ProductCardData } from "@/lib/queries";
import { cn, formatDate, formatPrice, resolveDiscount } from "@/lib/utils";

interface ProductCardProps {
  product: ProductCardData;
  variant?: "default" | "flash";
  priority?: boolean;
}

export function ProductCard({
  product,
  variant = "default",
  priority = false,
}: ProductCardProps) {
  const discount = resolveDiscount(
    product.originalPrice,
    product.currentPrice,
    product.discountPercentage,
  );

  const originalPrice = formatPrice(product.originalPrice);
  const currentPrice = formatPrice(product.currentPrice);
  const isFlash = variant === "flash";
  const updatedAt = formatDate(product.updatedAt);

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white transition-shadow duration-200",
        isFlash
          ? "border-brand-500/70 shadow-[0_1px_3px_rgb(15_23_42/0.06),0_6px_20px_rgb(245_196_0/0.18)]"
          : "border-slate-200/80 shadow-[var(--shadow-card)]",
        "hover:shadow-[var(--shadow-card-hover)]",
      )}
    >
      {/* Imagem */}
      <div className="relative aspect-square w-full overflow-hidden bg-slate-50">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
            priority={priority}
            loading={priority ? undefined : "lazy"}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
            Sem imagem
          </div>
        )}

        {/* Badges */}
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {isFlash && (
            <span className="rounded-full bg-brand-400 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-ink-900">
              ⚡ Relâmpago
            </span>
          )}
          {product.isFeatured && !isFlash && (
            <span className="rounded-full bg-brand-600 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
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

      {/* Conteudo */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {product.store && (
          <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-600">
            {product.store.name}
          </span>
        )}

        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-ink-900">
          <Link
            href={`/produto/${product.slug}`}
            className="outline-none after:absolute after:inset-0 after:content-[''] focus-visible:underline"
          >
            {product.name}
          </Link>
        </h3>

        {product.description && (
          <p className="line-clamp-2 text-xs leading-relaxed text-ink-500">
            {product.description}
          </p>
        )}

        {/* Precos */}
        <div className="mt-auto pt-2">
          {originalPrice && discount !== null && (
            <p className="text-xs text-slate-400 line-through">
              De: {originalPrice}
            </p>
          )}
          {currentPrice ? (
            <p className="text-xl font-extrabold leading-tight text-ink-900">
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

        {isFlash && product.expiresAt && (
          <CountdownBadge expiresAt={product.expiresAt.toISOString()} />
        )}

        {/* CTA - z-10 para ficar acima do overlay do titulo */}
        <a
          href={`/go/${product.id}`}
          target="_blank"
          rel="nofollow sponsored noopener noreferrer"
          className={cn(
            "relative z-10 mt-3 flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold uppercase tracking-wide transition-colors",
            isFlash
              ? "bg-brand-400 text-ink-900 hover:bg-brand-500"
              : "bg-brand-600 text-white hover:bg-brand-700",
          )}
          aria-label={`Ver oferta: ${product.name}`}
        >
          Ver oferta
        </a>

        {updatedAt && (
          <p className="text-center text-[10px] text-slate-400">
            Atualizado em {updatedAt}
          </p>
        )}
      </div>
    </article>
  );
}
