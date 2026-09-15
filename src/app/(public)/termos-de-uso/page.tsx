import type { Metadata } from "next";

import { getSiteSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: "Condições de uso do site Preço de Banana.",
  alternates: { canonical: "/termos-de-uso" },
};

export default async function TermosPage() {
  const settings = await getSiteSettings();

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-ink-900">
        Termos de Uso
      </h1>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-ink-700 sm:text-base">
        <section>
          <h2 className="text-lg font-bold text-ink-900">Sobre o site</h2>
          <p className="mt-2">
            O {settings.siteName} divulga promoções e produtos de lojas
            parceiras. Não vendemos nada diretamente: toda compra acontece no
            site da loja escolhida.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-ink-900">
            Preços e disponibilidade
          </h2>
          <p className="mt-2">
            Preços, descontos e estoque são definidos pelas lojas e mudam a
            qualquer momento, sem aviso. Fazemos o possível para manter as
            informações atualizadas, mas o valor válido é sempre o exibido na
            loja no momento da compra. Confira antes de finalizar o pedido.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-ink-900">
            Compras, entregas e trocas
          </h2>
          <p className="mt-2">
            Pagamento, entrega, garantia, troca e devolução são de
            responsabilidade exclusiva da loja onde a compra foi realizada.
            Qualquer problema com o pedido deve ser tratado diretamente com ela.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-ink-900">
            Links de afiliados
          </h2>
          <p className="mt-2">
            Alguns links são de afiliados e podem gerar comissão para nós, sem
            custo adicional para você. Isso não influencia o preço praticado
            pela loja.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-ink-900">Contato</h2>
          <p className="mt-2">
            {settings.contactEmail ? (
              <>
                Dúvidas sobre estes termos:{" "}
                <a
                  href={`mailto:${settings.contactEmail}`}
                  className="font-semibold text-brand-700 hover:underline"
                >
                  {settings.contactEmail}
                </a>
                .
              </>
            ) : (
              "Em caso de dúvidas sobre estes termos, entre em contato pelos nossos canais oficiais."
            )}
          </p>
        </section>
      </div>
    </article>
  );
}
