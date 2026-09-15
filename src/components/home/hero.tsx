import Image from "next/image";

import {
  CartIcon,
  ShieldIcon,
  SparklesIcon,
  TagIcon,
} from "@/components/icons";
import { TelegramButton } from "@/components/telegram-button";
import { getHeroImage } from "@/lib/hero-image";
import { cn } from "@/lib/utils";

interface HeroProps {
  title: string;
  subtitle: string;
  telegramUrl: string;
}

/**
 * Divide o titulo para o efeito bicolor da referencia: a ULTIMA palavra
 * ganha destaque em amarelo, o restante fica em tom escuro.
 * "PRECO DE BANANA" -> "PRECO DE" / "BANANA"
 */
function splitTitle(title: string): [string, string] {
  const words = title.trim().split(/\s+/);
  if (words.length <= 1) return [title, ""];
  return [words.slice(0, -1).join(" "), words[words.length - 1]];
}

export function Hero({ title, subtitle, telegramUrl }: HeroProps) {
  const [firstLine, restLine] = splitTitle(title);
  const heroImage = getHeroImage();

  return (
    <section className="hero-glow relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:gap-4 lg:py-16 lg:px-8">
        {/* Coluna esquerda */}
        <div className="relative z-10">
          <h1 className="heading-xl text-[2.75rem] sm:text-6xl lg:text-7xl">
            <span className="block text-ink-900">{firstLine}</span>
            {restLine && (
              <span className="block text-brand-500 [-webkit-text-stroke:2px_var(--color-ink-900)]">
                {restLine}
              </span>
            )}
          </h1>

          <p className="mt-5 max-w-md text-base leading-relaxed text-ink-500 sm:text-lg">
            {subtitle}
          </p>

          <div className="mt-7">
            <TelegramButton href={telegramUrl} size="lg" className="w-full sm:w-auto">
              Entre no grupo do Telegram
            </TelegramButton>

            {!telegramUrl?.trim() && (
              <p className="rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm text-ink-500">
                Configure o link do Telegram em{" "}
                <span className="font-semibold">/admin/settings</span> para
                exibir o botão.
              </p>
            )}
          </div>

          <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold uppercase tracking-wide text-ink-500">
            <ShieldIcon className="h-4 w-4 text-brand-600" />
            <span>100% grátis</span>
            <span aria-hidden="true" className="text-slate-300">
              •
            </span>
            <span>Ofertas todos os dias</span>
          </p>
        </div>

        {/* Coluna direita - mascote + elementos graficos */}
        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="relative aspect-square w-full">
            {/*
              Decoracao (circulo, anel e icones) apenas quando a imagem e um
              recorte da pessoa. Se a arte ja e um selo fechado - com circulo,
              icones e nome da marca embutidos - tudo isso apareceria em
              duplicado.
            */}
            {!heroImage.isSelfContained && (
              <>
                <div
                  className="absolute left-1/2 top-1/2 h-[78%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500"
                  aria-hidden="true"
                />
                <div
                  className="absolute left-1/2 top-1/2 h-[86%] w-[86%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-brand-200"
                  aria-hidden="true"
                />
              </>
            )}

            <Image
              src={heroImage.src}
              alt={
                heroImage.isPlaceholder
                  ? ""
                  : "Preco de Banana - as melhores promocoes"
              }
              aria-hidden={heroImage.isPlaceholder || undefined}
              fill
              sizes="(max-width: 1024px) 90vw, 45vw"
              className={cn(
                "relative z-10",
                heroImage.isSelfContained
                  ? "object-contain"
                  : "object-contain object-bottom",
              )}
              priority
              unoptimized={heroImage.isPlaceholder}
            />

            {!heroImage.isSelfContained && (
              <>
                <TagIcon
                  className="absolute left-[2%] top-[18%] z-20 h-10 w-10 rotate-[-12deg] text-brand-400/70 sm:h-12 sm:w-12"
                  aria-hidden="true"
                />
                <CartIcon
                  className="absolute right-[2%] top-[10%] z-20 h-10 w-10 text-brand-400/70 sm:h-12 sm:w-12"
                  aria-hidden="true"
                />
                <SparklesIcon
                  className="absolute bottom-[22%] left-[6%] z-20 h-7 w-7 text-brand-300 sm:h-9 sm:w-9"
                  aria-hidden="true"
                />

                {/* Selo "Economize de verdade" */}
                <div className="absolute -bottom-2 right-0 z-30 max-w-[13rem] rotate-[-4deg] rounded-2xl border-2 border-brand-500 bg-brand-300 p-3.5 shadow-[var(--shadow-card)] sm:-right-2">
                  <p className="flex items-center gap-1.5 text-sm font-extrabold uppercase text-ink-900">
                    <ShieldIcon className="h-4 w-4" />
                    Economize
                  </p>
                  <p className="mt-0.5 text-lg font-extrabold uppercase leading-none text-ink-900">
                    de verdade!
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
