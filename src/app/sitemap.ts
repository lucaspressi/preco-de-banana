import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/ofertas`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/cupons`, changeFrequency: "daily", priority: 0.8 },
    {
      url: `${base}/politica-de-privacidade`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    { url: `${base}/termos-de-uso`, changeFrequency: "yearly", priority: 0.2 },
  ];

  try {
    const [products, categories, stores] = await Promise.all([
      prisma.product.findMany({
        where: {
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        select: { slug: true, updatedAt: true },
        take: 5000,
      }),
      prisma.category.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.store.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
      }),
    ]);

    return [
      ...staticRoutes,
      ...products.map((product) => ({
        url: `${base}/produto/${product.slug}`,
        lastModified: product.updatedAt,
        changeFrequency: "daily" as const,
        priority: 0.7,
      })),
      ...categories.map((category) => ({
        url: `${base}/categoria/${category.slug}`,
        lastModified: category.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
      ...stores.map((store) => ({
        url: `${base}/loja/${store.slug}`,
        lastModified: store.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.5,
      })),
    ];
  } catch {
    // Banco indisponivel no build: entrega ao menos as rotas estaticas.
    return staticRoutes;
  }
}
