import "server-only";

import { cache } from "react";

import { prisma } from "@/lib/prisma";

export interface SiteSettingsData {
  siteName: string;
  siteDescription: string;
  telegramUrl: string;
  instagramUrl: string | null;
  youtubeUrl: string | null;
  contactEmail: string | null;
  heroTitle: string;
  heroSubtitle: string;
}

const DEFAULTS: SiteSettingsData = {
  siteName: "Preço de Banana",
  siteDescription:
    "Promoções, cupons e produtos selecionados para você pagar preço de banana.",
  telegramUrl: "",
  instagramUrl: null,
  youtubeUrl: null,
  contactEmail: null,
  heroTitle: "PREÇO DE BANANA",
  heroSubtitle:
    "As melhores promoções da internet, todos os dias!",
};

/**
 * Configuracoes globais do site.
 *
 * `cache` deduplica a consulta dentro de um mesmo render - varios componentes
 * podem chamar sem gerar N queries.
 *
 * Nunca lanca: se o banco estiver indisponivel, o site continua no ar com os
 * valores padrao.
 */
export const getSiteSettings = cache(async (): Promise<SiteSettingsData> => {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "singleton" },
    });

    if (!settings) return DEFAULTS;

    return {
      siteName: settings.siteName,
      siteDescription: settings.siteDescription,
      telegramUrl: settings.telegramUrl,
      instagramUrl: settings.instagramUrl,
      youtubeUrl: settings.youtubeUrl,
      contactEmail: settings.contactEmail,
      heroTitle: settings.heroTitle,
      heroSubtitle: settings.heroSubtitle,
    };
  } catch {
    return DEFAULTS;
  }
});

/** true quando ha um link do Telegram configurado no admin. */
export function hasTelegram(settings: SiteSettingsData): boolean {
  return Boolean(settings.telegramUrl?.trim());
}
