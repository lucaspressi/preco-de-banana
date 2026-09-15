import type { Metadata } from "next";

import { CouponCard } from "@/components/coupon-card";
import { EmptyState } from "@/components/empty-state";
import { TelegramButton } from "@/components/telegram-button";
import { getActiveCoupons } from "@/lib/queries";
import { getSiteSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Cupons de Desconto",
  description:
    "Cupons de desconto válidos das melhores lojas, atualizados com frequência.",
  alternates: { canonical: "/cupons" },
};

export const revalidate = 300;

export default async function CuponsPage() {
  const [coupons, settings] = await Promise.all([
    getActiveCoupons(),
    getSiteSettings(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8 text-center">
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-ink-900 sm:text-4xl">
          Cupons exclusivos das{" "}
          <span className="text-brand-600">melhores lojas</span>
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-ink-500 sm:text-base">
          Copie o código e aproveite o desconto direto na loja.
        </p>
      </header>

      {coupons.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {coupons.map((coupon) => (
            <CouponCard key={coupon.id} coupon={coupon} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Nenhum cupom ativo no momento"
          description="Assim que novos cupons forem cadastrados, eles aparecem aqui."
          action={
            settings.telegramUrl ? (
              <TelegramButton href={settings.telegramUrl} size="md">
                Receber cupons no Telegram
              </TelegramButton>
            ) : undefined
          }
        />
      )}

      {coupons.length > 0 && settings.telegramUrl && (
        <div className="mt-10 flex justify-center">
          <TelegramButton href={settings.telegramUrl} size="lg">
            Receber cupons em primeira mão
          </TelegramButton>
        </div>
      )}
    </div>
  );
}
