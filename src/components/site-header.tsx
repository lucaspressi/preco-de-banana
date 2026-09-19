import Link from "next/link";

import { BrandLogo } from "@/components/brand-logo";
import { TelegramButton } from "@/components/telegram-button";
import { getSiteSettings } from "@/lib/settings";

export async function SiteHeader() {
  const settings = await getSiteSettings();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:h-20 lg:px-8">
        <Link href="/" aria-label="Preço de Banana — Início">
          <BrandLogo />
        </Link>

        <TelegramButton
          href={settings.telegramUrl}
          size="sm"
          className="hidden sm:inline-flex"
        >
          Entrar no Telegram
        </TelegramButton>
      </div>
    </header>
  );
}
