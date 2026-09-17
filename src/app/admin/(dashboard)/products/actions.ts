"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { CACHE_TAGS } from "@/lib/queries";
import { slugify } from "@/lib/utils";
import { fetchPromoProducts } from "@/lib/promo-feed";
import { productSchema } from "@/lib/validations";

export interface ProductFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
}

/** Revalida todas as rotas publicas afetadas por uma mudanca em produtos. */
function revalidatePublicPages(slug?: string, categorySlug?: string, storeSlug?: string) {
  // Invalida as consultas cacheadas por tag (home, destaques).
  // updateTag (Next 16) garante read-your-own-writes em Server Actions:
  // ao voltar para a listagem, o dado novo ja aparece.
  updateTag(CACHE_TAGS.products);
  revalidatePath("/");
  revalidatePath("/ofertas");
  revalidatePath("/sitemap.xml");
  if (slug) revalidatePath(`/produto/${slug}`);
  if (categorySlug) revalidatePath(`/categoria/${categorySlug}`);
  if (storeSlug) revalidatePath(`/loja/${storeSlug}`);
  revalidatePath("/admin/products");
}

/** Garante slug unico, acrescentando sufixo numerico quando necessario. */
async function ensureUniqueSlug(
  desired: string,
  ignoreId?: string,
): Promise<string> {
  const base = slugify(desired) || "produto";
  let candidate = base;
  let suffix = 2;

  for (;;) {
    const existing = await prisma.product.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing || existing.id === ignoreId) return candidate;

    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

function parseForm(formData: FormData) {
  return productSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") || slugify(String(formData.get("name") ?? "")),
    description: formData.get("description"),
    imageUrl: formData.get("imageUrl"),
    affiliateUrl: formData.get("affiliateUrl"),
    originalUrl: formData.get("originalUrl"),
    originalPrice: formData.get("originalPrice"),
    currentPrice: formData.get("currentPrice"),
    discountPercentage: formData.get("discountPercentage"),
    couponCode: formData.get("couponCode"),
    categoryId: formData.get("categoryId"),
    storeId: formData.get("storeId"),
    isFeatured: formData.get("isFeatured") === "on",
    isFlashDeal: formData.get("isFlashDeal") === "on",
    isActive: formData.get("isActive") === "on",
    priority: formData.get("priority") || 0,
    expiresAt: formData.get("expiresAt"),
  });
}

function collectFieldErrors(
  error: import("zod").ZodError,
): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

export async function createProductAction(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin();

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return {
      error: "Verifique os campos destacados.",
      fieldErrors: collectFieldErrors(parsed.error),
    };
  }

  const data = parsed.data;
  const slug = await ensureUniqueSlug(data.slug || data.name);

  let created;
  try {
    created = await prisma.product.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        imageUrl: data.imageUrl,
        affiliateUrl: data.affiliateUrl,
        originalUrl: data.originalUrl,
        originalPrice: data.originalPrice,
        currentPrice: data.currentPrice,
        discountPercentage: data.discountPercentage,
        couponCode: data.couponCode,
        categoryId: data.categoryId || null,
        storeId: data.storeId || null,
        isFeatured: data.isFeatured,
        isFlashDeal: data.isFlashDeal,
        isActive: data.isActive,
        priority: data.priority,
        expiresAt: data.expiresAt,
      },
      include: {
        category: { select: { slug: true } },
        store: { select: { slug: true } },
      },
    });
  } catch (error) {
    console.error("[admin] falha ao criar produto:", error);
    return { error: "Não foi possível salvar o produto. Tente novamente." };
  }

  revalidatePublicPages(
    created.slug,
    created.category?.slug,
    created.store?.slug,
  );

  redirect("/admin/products?created=1");
}

export async function updateProductAction(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Produto não identificado." };

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return {
      error: "Verifique os campos destacados.",
      fieldErrors: collectFieldErrors(parsed.error),
    };
  }

  const data = parsed.data;
  const slug = await ensureUniqueSlug(data.slug || data.name, id);

  let updated;
  try {
    updated = await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        slug,
        description: data.description ?? null,
        imageUrl: data.imageUrl ?? null,
        affiliateUrl: data.affiliateUrl,
        originalUrl: data.originalUrl ?? null,
        originalPrice: data.originalPrice ?? null,
        currentPrice: data.currentPrice ?? null,
        discountPercentage: data.discountPercentage ?? null,
        couponCode: data.couponCode ?? null,
        categoryId: data.categoryId || null,
        storeId: data.storeId || null,
        isFeatured: data.isFeatured,
        isFlashDeal: data.isFlashDeal,
        isActive: data.isActive,
        priority: data.priority,
        expiresAt: data.expiresAt ?? null,
      },
      include: {
        category: { select: { slug: true } },
        store: { select: { slug: true } },
      },
    });
  } catch (error) {
    console.error("[admin] falha ao atualizar produto:", error);
    return { error: "Não foi possível salvar as alterações." };
  }

  revalidatePublicPages(
    updated.slug,
    updated.category?.slug,
    updated.store?.slug,
  );

  redirect("/admin/products?updated=1");
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  try {
    const deleted = await prisma.product.delete({
      where: { id },
      include: {
        category: { select: { slug: true } },
        store: { select: { slug: true } },
      },
    });
    revalidatePublicPages(
      deleted.slug,
      deleted.category?.slug,
      deleted.store?.slug,
    );
  } catch (error) {
    console.error("[admin] falha ao excluir produto:", error);
  }

  redirect("/admin/products?deleted=1");
}

/** Alterna isActive, isFeatured ou isFlashDeal direto na listagem. */

export interface PromoFeedItem {
  id: string;
  title: string;
  price: number | null;
  oldPrice: number | null;
  discountPct: number | null;
  imageUrl: string | null;
  url: string | null;
  category: string | null;
}

export async function fetchPromoFeedAction(): Promise<PromoFeedItem[]> {
  await requireAdmin();
  return fetchPromoProducts({ limit: 50, sort: "discount" });
}

export async function toggleProductFlagAction(
  formData: FormData,
): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const field = String(formData.get("field") ?? "");

  const ALLOWED = ["isActive", "isFeatured", "isFlashDeal"] as const;
  type Flag = (typeof ALLOWED)[number];

  if (!id || !ALLOWED.includes(field as Flag)) return;

  const flag = field as Flag;

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      select: { isActive: true, isFeatured: true, isFlashDeal: true },
    });
    if (!product) return;

    const updated = await prisma.product.update({
      where: { id },
      data: { [flag]: !product[flag] },
      include: {
        category: { select: { slug: true } },
        store: { select: { slug: true } },
      },
    });

    revalidatePublicPages(
      updated.slug,
      updated.category?.slug,
      updated.store?.slug,
    );
  } catch (error) {
    console.error("[admin] falha ao alternar flag:", error);
  }
}
