import { Suspense } from "react";

import { FloatingTelegramCta } from "@/components/floating-telegram-cta";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getSiteSettings } from "@/lib/settings";

/** Layout do site publico: header, footer e CTA flutuante. */
export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSiteSettings();

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white"
      >
        Pular para o conteúdo
      </a>

      <Suspense fallback={<div className="h-16 lg:h-20" />}>
        <SiteHeader />
      </Suspense>

      <main id="conteudo" className="flex-1">
        {children}
      </main>

      <SiteFooter />

      <FloatingTelegramCta telegramUrl={settings.telegramUrl} />
    </div>
  );
}
