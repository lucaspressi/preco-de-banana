import Link from "next/link";

import { BrandLogo } from "@/components/brand-logo";
import { MobileMenu } from "@/components/mobile-menu";
import { SearchBar } from "@/components/search-bar";
import { ShieldIcon, TagIcon, TruckIcon } from "@/components/icons";
import { TelegramButton } from "@/components/telegram-button";
import { getSiteSettings } from "@/lib/settings";

export const NAV_LINKS = [
  { href: "/ofertas", label: "Ofertas" },
  { href: "/#categorias", label: "Categorias" },
  { href: "/cupons", label: "Cupons" },
  { href: "/ofertas?sort=discount", label: "Mais vendidos" },
] as const;

/** Selos de confianca exibidos no topo, como na referencia. */
const TRUST_BADGES = [
  {
    icon: TagIcon,
    title: "Promoções de verdade",
    subtitle: "Todos os dias",
  },
  {
    icon: TruckIcon,
    title: "Entrega rápida",
    subtitle: "Produtos com envio ágil",
  },
  {
    icon: ShieldIcon,
    title: "100% confiável",
    subtitle: "Lojas verificadas",
  },
] as const;

export async function SiteHeader() {
  const settings = await getSiteSettings();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:h-20 lg:px-8">
        <BrandLogo />

        {/* Selos - apenas em telas largas */}
        <div className="ml-6 hidden items-center gap-6 xl:flex">
          {TRUST_BADGES.map(({ icon: Icon, title, subtitle }) => (
            <div key={title} className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Icon className="h-4.5 w-4.5" />
              </span>
              <span className="leading-tight">
                <span className="block text-[11px] font-bold text-ink-900">
                  {title}
                </span>
                <span className="block text-[10px] text-ink-500">
                  {subtitle}
                </span>
              </span>
            </div>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2 lg:gap-3">
          <nav
            aria-label="Navegação principal"
            className="hidden items-center gap-1 lg:flex xl:hidden 2xl:flex"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-ink-700 transition-colors hover:bg-brand-50 hover:text-brand-700"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:block md:w-48 lg:w-56">
            <SearchBar compact />
          </div>

          <TelegramButton
            href={settings.telegramUrl}
            size="sm"
            className="hidden sm:inline-flex"
          >
            Entrar no Telegram
          </TelegramButton>

          <MobileMenu
            links={[...NAV_LINKS]}
            telegramUrl={settings.telegramUrl}
          />
        </div>
      </div>
    </header>
  );
}
