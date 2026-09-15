import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Entrar no painel",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <span className="font-display text-sm font-extrabold uppercase tracking-[0.08em] text-ink-900">
            PREÇO DE
          </span>
          <span className="block font-display text-2xl font-extrabold uppercase tracking-tight text-brand-600">
            Banana
          </span>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[var(--shadow-card)]">
          <h1 className="text-lg font-extrabold text-ink-900">
            Painel administrativo
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Acesso restrito. Entre com suas credenciais.
          </p>

          <Suspense fallback={<div className="mt-6 h-56" />}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
