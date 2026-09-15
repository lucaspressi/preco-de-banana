"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { CloseIcon, MenuIcon } from "@/components/icons";
import { SearchBar } from "@/components/search-bar";
import { TelegramButton } from "@/components/telegram-button";

interface MobileMenuProps {
  links: Array<{ href: string; label: string }>;
  telegramUrl: string;
}

export function MobileMenu({ links, telegramUrl }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  /*
    Fecha ao navegar.
    Em vez de setState dentro de um efeito (que gera render em cascata),
    derivamos do pathname: se a rota mudou, o menu ja esta fechado.
  */
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    if (open) setOpen(false);
  }

  // Trava o scroll do body e fecha no Escape
  useEffect(() => {
    if (!open) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    panelRef.current?.focus();

    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-900 transition-colors hover:bg-slate-100 lg:hidden"
        aria-label="Abrir menu"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <MenuIcon className="h-6 w-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-ink-900/40"
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
            tabIndex={-1}
          />

          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navegação"
            tabIndex={-1}
            className="absolute right-0 top-0 flex h-full w-[min(20rem,85vw)] flex-col gap-5 overflow-y-auto bg-white p-5 shadow-xl outline-none"
          >
            <div className="flex items-center justify-between">
              <span className="font-display text-lg font-extrabold text-ink-900">
                Menu
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-900 transition-colors hover:bg-slate-100"
                aria-label="Fechar menu"
              >
                <CloseIcon className="h-6 w-6" />
              </button>
            </div>

            <SearchBar onNavigate={() => setOpen(false)} />

            <nav aria-label="Navegação principal" className="flex flex-col gap-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-xl px-4 py-3 text-base font-semibold text-ink-900 transition-colors hover:bg-brand-50 hover:text-brand-700"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <TelegramButton
              href={telegramUrl}
              size="lg"
              className="mt-auto w-full"
            >
              Entrar no Telegram
            </TelegramButton>
          </div>
        </div>
      )}
    </>
  );
}
