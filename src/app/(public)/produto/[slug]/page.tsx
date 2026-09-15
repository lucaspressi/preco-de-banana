import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CountdownBadge } from "@/components/countdown-badge";
import { ProductCard } from "@/components/product-card";
import { TelegramButton } from "@/components/telegram-button";
import { getSiteUrl } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import {
  PRODUCT_CARD_SELECT,
  getProductBySlug,
  DEFAULT_PRODUCT_ORDER,
} from "@/lib/queries";
import { getSiteSettings } from "@/lib/settings";
import { formatDate, formatPrice, resolveDiscount, toNumber } from "@/lib/utils";

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) return { title: "Produto não encontrado" };

  const price = formatPrice(product.currentPrice);
  const description =
    product.description ??
    `${product.name}${price ? ` por ${price}` : ""}${
      product.store ? ` na ${product.store.name}` : ""
    }.`;

  return {
    title: product.name,
    description: description.slice(0, 160),
    alternates: { canonical: `/produto/${product.slug}` },
    openGraph: {
      title: product.name,
      description: description.slice(0, 160),
      type: "website",
      images: product.imageUrl ? [{ url: product.imageUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: description.slice(0, 160),
      images: product.imageUrl ? [product.imageUrl] : undefined,
    },
  };
}

export default async function ProdutoPage({ params }: PageProps) {
  const { slug } = await params;

  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const settings = await getSiteSettings();

  const related = await prisma.product.findMany({
    where: {
      isActive: true,
      id: { not: product.id },
      ...(product.categoryId ? { categoryId: product.categoryId } : {}),
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: PRODUCT_CARD_SELECT,
    orderBy: DEFAULT_PRODUCT_ORDER,
    take: 4,
  });

  const discount = resolveDiscount(
    product.originalPrice,
    product.currentPrice,
    product.discountPercentage,
  );
  const originalPrice = formatPrice(product.originalPrice);
  const currentPrice = formatPrice(product.currentPrice);
  const currentPriceNumber = toNumber(product.currentPrice);
  const updatedAt = formatDate(product.updatedAt);

  // structured data - Product/Offer apenas com dados reais do banco
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    ...(product.description ? { description: product.description } : {}),
    ...(product.imageUrl ? { image: product.imageUrl } : {}),
    ...(product.store ? { brand: { "@type": "Brand", name: product.store.name } } : {}),
    ...(currentPriceNumber !== null
      ? {
          offers: {
            "@type": "Offer",
            price: currentPriceNumber.toFixed(2),
            priceCurrency: "BRL",
            availability: "https://schema.org/InStock",
            url: `${getSiteUrl()}/produto/${product.slug}`,
          },
        }
      : {}),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav aria-label="Você está aqui" className="mb-6 text-sm text-ink-500">
        <Link href="/" className="hover:text-brand-700">
          Início
        </Link>
        <span aria-hidden="true" className="mx-2 text-slate-300">
          /
        </span>
        {product.category ? (
          <>
            <Link
              href={`/categoria/${product.category.slug}`}
              className="hover:text-brand-700"
            >
              {product.category.name}
            </Link>
            <span aria-hidden="true" className="mx-2 text-slate-300">
              /
            </span>
          </>
        ) : null}
        <span className="font-semibold text-ink-900">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Imagem */}
        <div className="relative aspect-square overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-contain p-6"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              Sem imagem
            </div>
          )}

          {discount !== null && (
            <span className="absolute right-4 top-4 rounded-full bg-danger-500 px-3 py-1.5 text-sm font-bold text-white">
              -{discount}%
            </span>
          )}
        </div>

        {/* Informacoes */}
        <div className="flex flex-col">
          {product.store && (
            <Link
              href={`/loja/${product.store.slug}`}
              className="text-xs font-bold uppercase tracking-wide text-brand-600 hover:underline"
            >
              {product.store.name}
            </Link>
          )}

          <h1 className="mt-2 font-display text-2xl font-extrabold leading-tight text-ink-900 sm:text-3xl">
            {product.name}
          </h1>

          {product.description && (
            <p className="mt-4 text-sm leading-relaxed text-ink-500 sm:text-base">
              {product.description}
            </p>
          )}

          <div className="mt-6 rounded-2xl bg-slate-50 p-5">
            {originalPrice && discount !== null && (
              <p className="text-sm text-slate-400 line-through">
                De: {originalPrice}
              </p>
            )}
            {currentPrice ? (
              <p className="text-3xl font-extrabold text-ink-900 sm:text-4xl">
                {currentPrice}
              </p>
            ) : (
              <p className="text-lg font-bold text-ink-700">
                Confira o preço na loja
              </p>
            )}

            {product.couponCode && (
              <p className="mt-3 text-sm text-ink-700">
                Use o cupom:{" "}
                <span className="rounded-lg bg-brand-100 px-2 py-1 font-mono font-bold text-brand-700">
                  {product.couponCode}
                </span>
              </p>
            )}

            {product.isFlashDeal && product.expiresAt && (
              <div className="mt-3">
                <CountdownBadge expiresAt={product.expiresAt.toISOString()} />
              </div>
            )}
          </div>

          <a
            href={`/go/${product.id}`}
            target="_blank"
            rel="nofollow sponsored noopener noreferrer"
            className="mt-5 flex w-full items-center justify-center rounded-xl bg-brand-600 px-6 py-4 text-base font-bold uppercase tracking-wide text-white transition-colors hover:bg-brand-700"
          >
            Ver oferta
          </a>

          <p className="mt-3 text-xs leading-relaxed text-slate-400">
            Você será redirecionado para a loja parceira. Preço e
            disponibilidade podem mudar a qualquer momento.
            {updatedAt && ` Atualizado em ${updatedAt}.`}
          </p>

          {settings.telegramUrl && (
            <div className="mt-6 rounded-2xl border border-brand-100 bg-brand-50 p-5">
              <p className="text-sm font-bold text-ink-900">
                Quer receber ofertas como essa todos os dias?
              </p>
              <TelegramButton
                href={settings.telegramUrl}
                size="md"
                className="mt-3 w-full sm:w-auto"
              >
                Entrar no Telegram
              </TelegramButton>
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-6 font-display text-xl font-extrabold uppercase tracking-tight text-ink-900 sm:text-2xl">
            Você também pode gostar
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
