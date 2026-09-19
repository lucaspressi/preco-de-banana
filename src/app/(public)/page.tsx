import { BenefitsBar } from "@/components/home/benefits-bar";
import { FinalCta } from "@/components/home/final-cta";
import { Hero } from "@/components/home/hero";
import { TelegramButton } from "@/components/telegram-button";
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

      {/* Banner central de chamada para o Telegram */}
      {settings.telegramUrl && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-br from-brand-400 via-brand-500 to-accent-500 p-8 text-center shadow-lg sm:p-12">
            <h2 className="font-display text-3xl font-extrabold text-ink-900 sm:text-4xl">
              Quer economizar de verdade?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-ink-800">
              Nosso grupo do Telegram e onde as melhores ofertas aparecem primeiro.
              Cupons exclusivos, promocoes relampago e alertas de precos que nao
              encontramos em lugar nenhum.
            </p>
            <div className="mt-8 flex justify-center">
              <TelegramButton href={settings.telegramUrl} size="lg">
                Entrar no grupo do Telegram
              </TelegramButton>
            </div>
            <p className="mt-4 text-sm text-ink-700">
              Mais de mil pessoas ja economizam com a gente.
            </p>
          </div>
        </section>
      )}

      <FinalCta telegramUrl={settings.telegramUrl} />
    </>
  );
}
