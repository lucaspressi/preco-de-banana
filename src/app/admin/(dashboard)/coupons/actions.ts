"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { couponSchema } from "@/lib/validations";

export interface CrudState {
  error?: string;
  success?: string;
}

function revalidateAll() {
  revalidatePath("/cupons");
  revalidatePath("/admin/coupons");
}

export async function saveCouponAction(
  _prev: CrudState,
  formData: FormData,
): Promise<CrudState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");

  const parsed = couponSchema.safeParse({
    title: formData.get("title"),
    code: formData.get("code"),
    description: formData.get("description"),
    discount: formData.get("discount"),
    affiliateUrl: formData.get("affiliateUrl"),
    storeId: formData.get("storeId"),
    expiresAt: formData.get("expiresAt"),
    isActive: formData.get("isActive") === "on",
    priority: formData.get("priority") || 0,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const data = parsed.data;

  const payload = {
    title: data.title,
    code: data.code,
    description: data.description ?? null,
    discount: data.discount ?? null,
    affiliateUrl: data.affiliateUrl ?? null,
    storeId: data.storeId || null,
    expiresAt: data.expiresAt ?? null,
    isActive: data.isActive,
    priority: data.priority,
  };

  try {
    if (id) {
      await prisma.coupon.update({ where: { id }, data: payload });
    } else {
      await prisma.coupon.create({ data: payload });
    }
  } catch (error) {
    console.error("[admin] falha ao salvar cupom:", error);
    return { error: "Não foi possível salvar o cupom." };
  }

  revalidateAll();
  return { success: id ? "Cupom atualizado." : "Cupom criado." };
}

export async function deleteCouponAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  try {
    await prisma.coupon.delete({ where: { id } });
    revalidateAll();
  } catch (error) {
    console.error("[admin] falha ao excluir cupom:", error);
  }
}
