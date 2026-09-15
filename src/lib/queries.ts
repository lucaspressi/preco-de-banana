import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Tags de cache.
 *
 * As listagens de produto usam unstable_cache com tag "products": ficam
 * rapidas como conteudo estatico, mas o admin invalida sob demanda via
 * revalidateTag ao salvar - sem esperar o TTL.
 */
export const CACHE_TAGS = {
  products: "products",
  categories: "categories",
  stores: "stores",
  coupons: "coupons",
  testimonials: "testimonials",
} as const;

/**
 * Ordenacao padrao das ofertas (conforme especificado):
 *   1. priority DESC
 *   2. featured
 *   3. createdAt DESC
 */
export const DEFAULT_PRODUCT_ORDER: Prisma.ProductOrderByWithRelationInput[] = [
  { priority: "desc" },
  { isFeatured: "desc" },
  { createdAt: "desc" },
];

export const PRODUCT_CARD_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  imageUrl: true,
  originalPrice: true,
  currentPrice: true,
  discountPercentage: true,
  couponCode: true,
  isFeatured: true,
  isFlashDeal: true,
  expiresAt: true,
  updatedAt: true,
  createdAt: true,
  store: { select: { name: true, slug: true, logoUrl: true } },
  category: { select: { name: true, slug: true } },
} satisfies Prisma.ProductSelect;

export type ProductCard = Prisma.ProductGetPayload<{
  select: typeof PRODUCT_CARD_SELECT;
}>;

/** Produto visivel: ativo e nao expirado. */
function visibleProductWhere(): Prisma.ProductWhereInput {
  return {
    isActive: true,
    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
  };
}

export const getFeaturedProducts = cache(async (limit = 8) => {
  return unstable_cache(
    async (max: number) =>
      prisma.product.findMany({
        where: visibleProductWhere(),
        select: PRODUCT_CARD_SELECT,
        orderBy: DEFAULT_PRODUCT_ORDER,
        take: max,
      }),
    ["featured-products"],
    { tags: [CACHE_TAGS.products], revalidate: 300 },
  )(limit);
});

/**
 * Ofertas relampago ativas.
 * Itens expirados somem automaticamente por causa do filtro em expiresAt.
 */
export const getFlashDeals = cache(async (limit = 8) => {
  /*
    Sem unstable_cache: o filtro depende de "agora", entao um resultado
    cacheado poderia manter no ar uma oferta ja expirada. Correcao vale
    mais que o ganho de cache aqui.
  */
  return prisma.product.findMany({
    where: {
      isActive: true,
      isFlashDeal: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: PRODUCT_CARD_SELECT,
    orderBy: [{ expiresAt: "asc" }, ...DEFAULT_PRODUCT_ORDER],
    take: limit,
  });
});

export const getActiveCategories = cache(async () => {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ priority: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      icon: true,
      imageUrl: true,
      _count: { select: { products: { where: { isActive: true } } } },
    },
  });
});

export const getActiveStores = cache(async () => {
  return prisma.store.findMany({
    where: { isActive: true },
    orderBy: [{ priority: "desc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true, logoUrl: true, url: true },
  });
});

export const getActiveCoupons = cache(async (limit?: number) => {
  return prisma.coupon.findMany({
    where: {
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: {
      id: true,
      title: true,
      code: true,
      description: true,
      discount: true,
      affiliateUrl: true,
      expiresAt: true,
      store: { select: { name: true, slug: true, logoUrl: true } },
    },
  });
});

/**
 * Depoimentos reais cadastrados no admin.
 * Retorna vazio quando nao ha nenhum - a secao nao e renderizada.
 */
export const getActiveTestimonials = cache(async (limit = 6) => {
  return prisma.testimonial.findMany({
    where: { isActive: true },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: {
      id: true,
      authorName: true,
      content: true,
      rating: true,
      avatarUrl: true,
    },
  });
});

export const getProductBySlug = cache(async (slug: string) => {
  return prisma.product.findFirst({
    where: { slug, isActive: true },
    include: {
      store: true,
      category: true,
    },
  });
});

export const getCategoryBySlug = cache(async (slug: string) => {
  return prisma.category.findFirst({
    where: { slug, isActive: true },
  });
});

export const getStoreBySlug = cache(async (slug: string) => {
  return prisma.store.findFirst({
    where: { slug, isActive: true },
  });
});

export type ProductSort =
  | "recent"
  | "discount"
  | "price-asc"
  | "price-desc";

export interface ProductFilters {
  categorySlug?: string;
  storeSlug?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: ProductSort;
  flashOnly?: boolean;
  take?: number;
  skip?: number;
}

function sortToOrderBy(
  sort: ProductSort | undefined,
): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "discount":
      return [{ discountPercentage: "desc" }, { createdAt: "desc" }];
    case "price-asc":
      return [{ currentPrice: "asc" }, { createdAt: "desc" }];
    case "price-desc":
      return [{ currentPrice: "desc" }, { createdAt: "desc" }];
    case "recent":
      return [{ createdAt: "desc" }];
    default:
      return DEFAULT_PRODUCT_ORDER;
  }
}

/** Busca com filtros. Usada em /ofertas, /categoria/[slug] e /loja/[slug]. */
export async function findProducts(filters: ProductFilters = {}) {
  const {
    categorySlug,
    storeSlug,
    search,
    minPrice,
    maxPrice,
    sort,
    flashOnly,
    take = 24,
    skip = 0,
  } = filters;

  const where: Prisma.ProductWhereInput = {
    ...visibleProductWhere(),
    ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    ...(storeSlug ? { store: { slug: storeSlug } } : {}),
    ...(flashOnly ? { isFlashDeal: true } : {}),
  };

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.currentPrice = {
      ...(minPrice !== undefined ? { gte: minPrice } : {}),
      ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
    };
  }

  const term = search?.trim();
  if (term) {
    // Busca por nome, descricao, categoria e loja.
    where.AND = [
      {
        OR: [
          { name: { contains: term, mode: "insensitive" } },
          { description: { contains: term, mode: "insensitive" } },
          { category: { name: { contains: term, mode: "insensitive" } } },
          { store: { name: { contains: term, mode: "insensitive" } } },
        ],
      },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: PRODUCT_CARD_SELECT,
      orderBy: sortToOrderBy(sort),
      take,
      skip,
    }),
    prisma.product.count({ where }),
  ]);

  return { items, total };
}

/** Faixa de precos disponivel - alimenta o filtro da pagina de ofertas. */
export const getPriceBounds = cache(async () => {
  const result = await prisma.product.aggregate({
    where: { ...visibleProductWhere(), currentPrice: { not: null } },
    _min: { currentPrice: true },
    _max: { currentPrice: true },
  });

  return {
    min: result._min.currentPrice ? Number(result._min.currentPrice) : 0,
    max: result._max.currentPrice ? Number(result._max.currentPrice) : 0,
  };
});
