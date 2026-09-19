import Link from "next/link";

import { BrandLogo } from "@/components/brand-logo";
import { TelegramButton } from "@/components/telegram-button";
import { getSiteSettings } from "@/lib/settings";

const FOOTER_LINKS = [
  { href: "/politica-de-privacidade", label: "Política de Privacidade" },
  { href: "/termos-de-uso", label: "Termos de Uso" },
];

export async function SiteFooter() {
  const settings = await getSiteSettings();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <BrandLogo />
            <p className="mt-4 text-sm leading-relaxed text-ink-500">
              {settings.siteDescription}
            </p>

            {(settings.instagramUrl ||
              settings.youtubeUrl ||
              settings.contactEmail) && (
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                {settings.instagramUrl && (
                  <a
                    href={settings.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-brand-700 hover:underline"
                  >
                    Instagram
                  </a>
                )}
                {settings.youtubeUrl && (
                  <a
                    href={settings.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-brand-700 hover:underline"
                  >
                    YouTube
                  </a>
                )}
                {settings.contactEmail && (
                  <a
                    href={`mailto:${settings.contactEmail}`}
                    className="font-semibold text-brand-700 hover:underline"
                  >
                    {settings.contactEmail}
                  </a>
                )}
              </div>
            )}
          </div>

          <nav aria-label="Rodapé">
            <h2 className="text-xs font-bold uppercase tracking-wider text-ink-900">
              Navegação
            </h2>
            <ul className="mt-4 space-y-2.5">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-ink-500 transition-colors hover:text-brand-700"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {settings.telegramUrl && (
            <div className="max-w-xs">
              <h2 className="text-xs font-bold uppercase tracking-wider text-ink-900">
                Grupo do Telegram
              </h2>
              <p className="mt-4 text-sm text-ink-500">
                Receba as melhores ofertas todos os dias, direto no celular.
              </p>
              <TelegramButton
                href={settings.telegramUrl}
                className="mt-4"
                size="md"
              >
                Entrar no grupo
              </TelegramButton>
            </div>
          )}
        </div>

        {/* Disclaimer de afiliados - exigencia legal/etica */}
        <div className="mt-10 border-t border-slate-200 pt-6">
          <p className="text-xs leading-relaxed text-ink-500">
            Alguns links deste site são links de afiliados. Podemos receber uma
            comissão pelas compras realizadas através deles, sem custo adicional
            para você.
          </p>
          <p className="mt-3 text-xs text-slate-400">
            © {year} {settings.siteName}. Preços e disponibilidade podem mudar a
            qualquer momento nas lojas parceiras.
          </p>
        </div>
      </div>
    </footer>
  );
}
