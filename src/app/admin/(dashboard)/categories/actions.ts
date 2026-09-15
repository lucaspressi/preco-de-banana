"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { categorySchema } from "@/lib/validations";

export interface CrudState {
  error?: string;
  success?: string;
}

function revalidateAll(slug?: string) {
  revalidatePath("/");
  revalidatePath("/ofertas");
  revalidatePath("/admin/categories");
  if (slug) revalidatePath(`/categoria/${slug}`);
}

export async function saveCategoryAction(
  _prev: CrudState,
  formData: FormData,
): Promise<CrudState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "");

  const parsed = categorySchema.safeParse({
    name,
    slug: formData.get("slug") || slugify(name),
    description: formData.get("description"),
    icon: formData.get("icon"),
    imageUrl: formData.get("imageUrl"),
    isActive: formData.get("isActive") === "on",
    priority: formData.get("priority") || 0,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const data = parsed.data;

  try {
    if (id) {
      await prisma.category.update({ where: { id }, data });
    } else {
      await prisma.category.create({ data });
    }
  } catch (error) {
    console.error("[admin] falha ao salvar categoria:", error);
    return { error: "Já existe uma categoria com esse slug." };
  }

  revalidateAll(data.slug);
  return { success: id ? "Categoria atualizada." : "Categoria criada." };
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  try {
    // Produtos ficam sem categoria (onDelete: SetNull), nunca sao removidos.
    const deleted = await prisma.category.delete({ where: { id } });
    revalidateAll(deleted.slug);
  } catch (error) {
    console.error("[admin] falha ao excluir categoria:", error);
  }
}
