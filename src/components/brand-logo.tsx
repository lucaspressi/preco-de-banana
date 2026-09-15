import Link from "next/link";

import { TelegramIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  /** Em fundo azul, inverte as cores do texto. */
  inverted?: boolean;
  href?: string;
}

/**
 * Logotipo tipografico: "PRECO DE" sobre "BANANA",
 * acompanhado do simbolo do Telegram - como na referencia.
 */
export function BrandLogo({
  className,
  inverted = false,
  href = "/",
}: BrandLogoProps) {
  return (
    <Link
      href={href}
      className={cn("group inline-flex items-center gap-2.5", className)}
      aria-label="Preço de Banana - página inicial"
    >
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full transition-transform group-hover:scale-105 sm:h-10 sm:w-10",
          inverted ? "bg-white text-accent-500" : "bg-accent-500 text-white",
        )}
        aria-hidden="true"
      >
        <TelegramIcon className="h-5 w-5" />
      </span>
      <span className="leading-[0.82]">
        <span
          className={cn(
            "block font-display text-[13px] font-extrabold uppercase tracking-[0.08em] sm:text-[15px]",
            inverted ? "text-white/90" : "text-ink-900",
          )}
        >
          Preço de
        </span>
        <span
          className={cn(
            "block font-display text-[22px] font-extrabold uppercase tracking-tight sm:text-[26px]",
            inverted ? "text-white" : "text-brand-600",
          )}
        >
          Banana
        </span>
      </span>
    </Link>
  );
}
