import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

async function getStats() {
  const now = new Date();

  const [
    activeProducts,
    totalProducts,
    flashDeals,
    categories,
    stores,
    activeCoupons,
    totalClicks,
    clicks7d,
    clicks30d,
    topProducts,
  ] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.count(),
    prisma.product.count({
      where: {
        isActive: true,
        isFlashDeal: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    }),
    prisma.category.count({ where: { isActive: true } }),
    prisma.store.count({ where: { isActive: true } }),
    prisma.coupon.count({
      where: {
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    }),
    prisma.affiliateClick.count(),
    prisma.affiliateClick.count({ where: { createdAt: { gte: daysAgo(7) } } }),
    prisma.affiliateClick.count({ where: { createdAt: { gte: daysAgo(30) } } }),
    prisma.affiliateClick.groupBy({
      by: ["productId"],
      _count: { productId: true },
      orderBy: { _count: { productId: "desc" } },
      take: 5,
    }),
  ]);

  const topProductIds = topProducts.map((item) => item.productId);
  const productNames = topProductIds.length
    ? await prisma.product.findMany({
        where: { id: { in: topProductIds } },
        select: { id: true, name: true, slug: true },
      })
    : [];

  const nameById = new Map(productNames.map((p) => [p.id, p]));

  return {
    activeProducts,
    totalProducts,
    flashDeals,
    categories,
    stores,
    activeCoupons,
    totalClicks,
    clicks7d,
    clicks30d,
    topProducts: topProducts
      .map((item) => ({
        product: nameById.get(item.productId),
        clicks: item._count.productId,
      }))
      .filter((item) => item.product),
  };
}

function StatCard({
  label,
  value,
  href,
  hint,
}: {
  label: string;
  value: number;
  href?: string;
  hint?: string;
}) {
  const content = (
    <>
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
        {label}
      </p>
      <p className="mt-1.5 text-2xl font-extrabold text-ink-900">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
    </>
  );

  const className =
    "block rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[var(--shadow-card)]";

  return href ? (
    <Link href={href} className={`${className} transition-shadow hover:shadow-[var(--shadow-card-hover)]`}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}

export default async function AdminDashboardPage() {
  const [stats, settings] = await Promise.all([getStats(), getSiteSettings()]);

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-2xl font-extrabold text-ink-900">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Visão geral do site e das ofertas publicadas.
        </p>
      </header>

      {!settings.telegramUrl && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">
            O link do Telegram ainda não foi configurado.
          </p>
          <p className="mt-1 text-sm text-amber-800">
            Os botões de CTA ficam ocultos no site até você preencher esse
            campo.{" "}
            <Link href="/admin/settings" className="font-bold underline">
              Configurar agora
            </Link>
          </p>
        </div>
      )}

      <section aria-label="Resumo" className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard
          label="Produtos ativos"
          value={stats.activeProducts}
          href="/admin/products"
          hint={`${stats.totalProducts} no total`}
        />
        <StatCard
          label="Ofertas relâmpago"
          value={stats.flashDeals}
          href="/admin/products?flash=1"
        />
        <StatCard
          label="Cupons ativos"
          value={stats.activeCoupons}
          href="/admin/coupons"
        />
        <StatCard
          label="Categorias"
          value={stats.categories}
          href="/admin/categories"
        />
        <StatCard label="Lojas" value={stats.stores} href="/admin/stores" />
        <StatCard label="Cliques (total)" value={stats.totalClicks} />
      </section>

      <section aria-label="Cliques" className="mt-8">
        <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-ink-900">
          Cliques em ofertas
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <StatCard label="Últimos 7 dias" value={stats.clicks7d} />
          <StatCard label="Últimos 30 dias" value={stats.clicks30d} />
          <StatCard label="Desde o início" value={stats.totalClicks} />
        </div>
      </section>

      {stats.topProducts.length > 0 && (
        <section aria-label="Mais clicados" className="mt-8">
          <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-ink-900">
            Produtos mais clicados
          </h2>
          <ol className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[var(--shadow-card)]">
            {stats.topProducts.map((item, index) => (
              <li
                key={item.product!.id}
                className="flex items-center gap-3 border-b border-slate-100 px-5 py-3 last:border-b-0"
              >
                <span className="w-5 shrink-0 text-sm font-bold text-slate-300">
                  {index + 1}
                </span>
                <Link
                  href={`/produto/${item.product!.slug}`}
                  target="_blank"
                  className="min-w-0 flex-1 truncate text-sm font-semibold text-ink-900 hover:text-brand-700"
                >
                  {item.product!.name}
                </Link>
                <span className="shrink-0 text-sm font-bold text-brand-700">
                  {item.clicks}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="mt-8">
        <Link
          href="/admin/products/new"
          className="inline-flex rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold uppercase tracking-wide text-white hover:bg-brand-700"
        >
          + Adicionar produto
        </Link>
      </section>
    </div>
  );
}
