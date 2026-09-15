"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { storeSchema } from "@/lib/validations";

export interface CrudState {
  error?: string;
  success?: string;
}

function revalidateAll(slug?: string) {
  revalidatePath("/");
  revalidatePath("/ofertas");
  revalidatePath("/admin/stores");
  if (slug) revalidatePath(`/loja/${slug}`);
}

export async function saveStoreAction(
  _prev: CrudState,
  formData: FormData,
): Promise<CrudState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "");

  const parsed = storeSchema.safeParse({
    name,
    slug: formData.get("slug") || slugify(name),
    logoUrl: formData.get("logoUrl"),
    url: formData.get("url"),
    isActive: formData.get("isActive") === "on",
    priority: formData.get("priority") || 0,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const data = parsed.data;

  try {
    if (id) {
      await prisma.store.update({ where: { id }, data });
    } else {
      await prisma.store.create({ data });
    }
  } catch (error) {
    console.error("[admin] falha ao salvar loja:", error);
    return { error: "Já existe uma loja com esse slug." };
  }

  revalidateAll(data.slug);
  return { success: id ? "Loja atualizada." : "Loja criada." };
}

export async function deleteStoreAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  try {
    const deleted = await prisma.store.delete({ where: { id } });
    revalidateAll(deleted.slug);
  } catch (error) {
    console.error("[admin] falha ao excluir loja:", error);
  }
}
