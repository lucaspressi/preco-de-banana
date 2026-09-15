"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { CloseIcon, MenuIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

import { logoutAction } from "./actions";

const NAV_ITEMS: ReadonlyArray<{
  href: string;
  label: string;
  exact?: boolean;
}> = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/products", label: "Produtos" },
  { href: "/admin/categories", label: "Categorias" },
  { href: "/admin/stores", label: "Lojas" },
  { href: "/admin/coupons", label: "Cupons" },
  { href: "/admin/testimonials", label: "Depoimentos" },
  { href: "/admin/settings", label: "Configurações" },
] as const;

interface AdminSidebarProps {
  email: string;
}

export function AdminSidebar({ email }: AdminSidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const nav = (
    <nav aria-label="Navegação do painel" className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setOpen(false)}
          aria-current={isActive(item.href, item.exact) ? "page" : undefined}
          className={cn(
            "rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
            isActive(item.href, item.exact)
              ? "bg-brand-600 text-white"
              : "text-ink-700 hover:bg-brand-50 hover:text-brand-700",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );

  const footer = (
    <div className="mt-auto border-t border-slate-200 pt-4">
      <p className="truncate px-4 text-xs text-ink-500" title={email}>
        {email}
      </p>
      <div className="mt-2 flex flex-col gap-1">
        <Link
          href="/"
          target="_blank"
          className="rounded-xl px-4 py-2 text-sm font-semibold text-ink-700 transition-colors hover:bg-slate-100"
        >
          Ver site ↗
        </Link>
        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full rounded-xl px-4 py-2 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
          >
            Sair
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Topo mobile */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <Link href="/admin" className="font-display text-lg font-extrabold text-ink-900">
          Painel
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-slate-100"
          aria-label="Abrir menu do painel"
          aria-expanded={open}
        >
          <MenuIcon className="h-6 w-6" />
        </button>
      </div>

      {/* Sidebar desktop */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-slate-200 bg-white p-4 lg:flex">
        <Link
          href="/admin"
          className="mb-6 block px-4 leading-[0.85]"
          aria-label="Painel - Preço de Banana"
        >
          <span className="block font-display text-[11px] font-extrabold uppercase tracking-[0.08em] text-ink-900">
            PREÇO DE
          </span>
          <span className="block font-display text-[19px] font-extrabold uppercase tracking-tight text-brand-600">
            Banana
          </span>
        </Link>
        {nav}
        {footer}
      </aside>

      {/* Drawer mobile */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-ink-900/40"
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
            tabIndex={-1}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menu do painel"
            className="absolute left-0 top-0 flex h-full w-[min(16rem,80vw)] flex-col bg-white p-4 shadow-xl"
          >
            <div className="mb-4 flex items-center justify-between px-2">
              <span className="font-display text-lg font-extrabold text-ink-900">
                Painel
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-slate-100"
                aria-label="Fechar menu"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
            {nav}
            {footer}
          </div>
        </div>
      )}
    </>
  );
}
