import { TelegramIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

interface TelegramButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "accent" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  showIcon?: boolean;
}

/*
  Os CTAs de Telegram usam VERDE, como na referencia.
  Branco sobre amarelo nao atinge contraste AA - o verde resolve isso e
  ainda destaca a acao principal sobre o fundo amarelo da pagina.
*/
const VARIANTS = {
  primary: "bg-accent-500 text-white hover:bg-accent-600",
  accent: "bg-accent-500 text-white hover:bg-accent-600",
  outline:
    "border-2 border-ink-900 text-ink-900 bg-white hover:bg-brand-50",
  ghost: "bg-white/15 text-white hover:bg-white/25",
} as const;

const SIZES = {
  sm: "px-4 py-2 text-xs gap-1.5",
  md: "px-5 py-2.5 text-sm gap-2",
  lg: "px-7 py-3.5 text-base gap-2.5",
} as const;

/**
 * CTA para o Telegram.
 *
 * A URL vem sempre de SiteSettings.telegramUrl (editavel em /admin/settings).
 * Se nao houver URL configurada, o componente nao renderiza nada - evita
 * botao quebrado em producao.
 */
export function TelegramButton({
  href,
  children,
  variant = "primary",
  size = "md",
  className,
  showIcon = true,
}: TelegramButtonProps) {
  if (!href?.trim()) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-bold uppercase tracking-wide transition-colors",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
    >
      {showIcon && <TelegramIcon className="h-4 w-4 shrink-0" />}
      {children}
    </a>
  );
}
