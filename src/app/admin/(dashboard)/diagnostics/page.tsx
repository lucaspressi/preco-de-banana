import Link from "next/link";

import { fetchPromoProducts } from "@/lib/promo-feed";

export const dynamic = "force-dynamic";

export default async function DiagnosticsPage() {
  const url = process.env.PROMO_API_URL?.trim() ?? "";
  const products = url ? await fetchPromoProducts({ limit: 2 }) : [];

  return (
    <div>
      <header className="mb-6">
        <Link
          href="/admin"
          className="text-sm font-semibold text-ink-500 hover:text-ink-900"
        >
          ← Voltar
        </Link>
        <h1 className="mt-2 font-display text-2xl font-extrabold text-ink-900">
          Diagnóstico do feed
        </h1>
      </header>

      <section className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-5">
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-ink-900">
          PROMO_API_URL
        </h2>
        <p className="font-mono text-sm text-ink-700">
          {url || "Não definida"}
        </p>

        <h2 className="pt-2 text-sm font-extrabold uppercase tracking-wide text-ink-900">
          Resultado do teste
        </h2>
        {url ? (
          <>
            <p className="text-sm text-ink-500">
              {products.length} produto(s) retornado(s).
            </p>
            {products.length > 0 && (
              <pre className="mt-2 max-h-96 overflow-auto rounded-xl bg-slate-50 p-3 text-xs text-ink-700">
                {JSON.stringify(products[0], null, 2)}
              </pre>
            )}
          </>
        ) : (
          <p className="text-sm font-medium text-red-600">
            A variável PROMO_API_URL não está configurada no servidor.
            Adicione-a no painel do Render e faça deploy.
          </p>
        )}
      </section>
    </div>
  );
}
