import { TelegramIcon } from "@/components/icons";
import { TelegramButton } from "@/components/telegram-button";

interface FinalCtaProps {
  telegramUrl: string;
}

/** Bloco azul de encerramento, com o CTA amarelo da referencia. */
export function FinalCta({ telegramUrl }: FinalCtaProps) {
  if (!telegramUrl?.trim()) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl bg-brand-600 px-6 py-10 sm:px-10 lg:px-14">
        <TelegramIcon
          className="pointer-events-none absolute -right-6 -top-6 h-40 w-40 text-white/10"
          aria-hidden="true"
        />

        <div className="relative flex flex-col items-start gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <h2 className="font-display text-2xl font-extrabold uppercase leading-tight tracking-tight text-white sm:text-3xl">
              Pronto para economizar de verdade?
            </h2>
            <p className="mt-2 text-sm text-white/85 sm:text-base">
              Entre agora no grupo do Telegram e receba as melhores ofertas.
            </p>
          </div>

          <div className="w-full shrink-0 lg:w-auto">
            <TelegramButton
              href={telegramUrl}
              variant="accent"
              size="lg"
              className="w-full lg:w-auto"
            >
              Quero entrar no grupo agora!
            </TelegramButton>
            <p className="mt-3 text-center text-[11px] font-semibold uppercase tracking-wide text-white/75 lg:text-left">
              Grátis para sempre • Ofertas todos os dias
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
