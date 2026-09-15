"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { siteSettingsSchema } from "@/lib/validations";

export interface SettingsState {
  error?: string;
  success?: string;
}

export async function saveSettingsAction(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  await requireAdmin();

  const parsed = siteSettingsSchema.safeParse({
    siteName: formData.get("siteName"),
    siteDescription: formData.get("siteDescription"),
    telegramUrl: formData.get("telegramUrl"),
    instagramUrl: formData.get("instagramUrl"),
    youtubeUrl: formData.get("youtubeUrl"),
    contactEmail: formData.get("contactEmail"),
    heroTitle: formData.get("heroTitle"),
    heroSubtitle: formData.get("heroSubtitle"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const data = parsed.data;

  const payload = {
    siteName: data.siteName,
    siteDescription: data.siteDescription,
    telegramUrl: data.telegramUrl ?? "",
    instagramUrl: data.instagramUrl ?? null,
    youtubeUrl: data.youtubeUrl ?? null,
    contactEmail: data.contactEmail ?? null,
    heroTitle: data.heroTitle,
    heroSubtitle: data.heroSubtitle,
  };

  try {
    await prisma.siteSettings.upsert({
      where: { id: "singleton" },
      update: payload,
      create: { id: "singleton", ...payload },
    });
  } catch (error) {
    console.error("[admin] falha ao salvar configuracoes:", error);
    return { error: "Não foi possível salvar as configurações." };
  }

  // As configuracoes aparecem no header/footer de todas as paginas.
  revalidatePath("/", "layout");

  return { success: "Configurações salvas." };
}
