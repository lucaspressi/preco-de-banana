"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { CloseIcon, TelegramIcon } from "@/components/icons";

interface FloatingTelegramCtaProps {
  telegramUrl: string;
}

/**
 * CTA flutuante discreto no mobile.
 *
 * Aparece apos rolar um pouco, pode ser dispensado, e nunca e exibido
 * nas rotas administrativas.
 */
export function FloatingTelegramCta({ telegramUrl }: FloatingTelegramCtaProps) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;

    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [dismissed]);

  if (!telegramUrl?.trim()) return null;
  if (pathname?.startsWith("/admin")) return null;
  if (dismissed || !visible) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-40 flex items-center gap-2 rounded-2xl bg-brand-600 p-2 pl-4 shadow-lg sm:hidden">
      <TelegramIcon className="h-5 w-5 shrink-0 text-white" />
      <p className="flex-1 text-sm font-semibold leading-tight text-white">
        Ofertas todos os dias no Telegram
      </p>
      <a
        href={telegramUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-xl bg-accent-400 px-3.5 py-2 text-xs font-bold uppercase text-white"
      >
        Entrar
      </a>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/80 hover:bg-white/10"
        aria-label="Dispensar convite do Telegram"
      >
        <CloseIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
