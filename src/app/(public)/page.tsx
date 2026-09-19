import Image from "next/image";

import { BenefitsBar } from "@/components/home/benefits-bar";
import { FinalCta } from "@/components/home/final-cta";
import { Hero } from "@/components/home/hero";
import { getSiteSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const settings = await getSiteSettings();

  return (
    <>
      <Hero
        title={settings.heroTitle}
        subtitle={settings.heroSubtitle}
        telegramUrl={settings.telegramUrl}
      />

      <div className="mt-4 lg:mt-2">
        <BenefitsBar />
      </div>

      {/* Banner central — imagem completa clicável para o Telegram */}
      {settings.telegramUrl && (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <a
            href={settings.telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block overflow-hidden rounded-3xl shadow-lg transition-transform hover:scale-[1.01]"
            aria-label="Entrar no grupo do Telegram do Preço de Banana"
          >
            <Image
              src="/banner-telegram.png"
              alt="Preço de Banana — Promoções de verdade todos os dias. Entrar no grupo grátis."
              width={2048}
              height={768}
              className="h-auto w-full"
              priority
            />
          </a>
        </section>
      )}

      <FinalCta telegramUrl={settings.telegramUrl} />
    </>
  );
}
