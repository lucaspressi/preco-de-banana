"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { testimonialSchema } from "@/lib/validations";

export interface CrudState {
  error?: string;
  success?: string;
}

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/admin/testimonials");
}

export async function saveTestimonialAction(
  _prev: CrudState,
  formData: FormData,
): Promise<CrudState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");

  const parsed = testimonialSchema.safeParse({
    authorName: formData.get("authorName"),
    content: formData.get("content"),
    rating: formData.get("rating"),
    avatarUrl: formData.get("avatarUrl"),
    isActive: formData.get("isActive") === "on",
    priority: formData.get("priority") || 0,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const data = parsed.data;

  const payload = {
    authorName: data.authorName,
    content: data.content,
    rating: data.rating ?? null,
    avatarUrl: data.avatarUrl ?? null,
    isActive: data.isActive,
    priority: data.priority,
  };

  try {
    if (id) {
      await prisma.testimonial.update({ where: { id }, data: payload });
    } else {
      await prisma.testimonial.create({ data: payload });
    }
  } catch (error) {
    console.error("[admin] falha ao salvar depoimento:", error);
    return { error: "Não foi possível salvar o depoimento." };
  }

  revalidateAll();
  return { success: id ? "Depoimento atualizado." : "Depoimento criado." };
}

export async function deleteTestimonialAction(
  formData: FormData,
): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  try {
    await prisma.testimonial.delete({ where: { id } });
    revalidateAll();
  } catch (error) {
    console.error("[admin] falha ao excluir depoimento:", error);
  }
}
