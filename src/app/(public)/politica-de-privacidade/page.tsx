import type { Metadata } from "next";

import { getSiteSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Como tratamos dados e cookies no site Preço de Banana.",
  alternates: { canonical: "/politica-de-privacidade" },
};

export default async function PrivacidadePage() {
  const settings = await getSiteSettings();

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-ink-900">
        Política de Privacidade
      </h1>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-ink-700 sm:text-base">
        <section>
          <h2 className="text-lg font-bold text-ink-900">
            Dados que coletamos
          </h2>
          <p className="mt-2">
            Este site não exige cadastro e não coleta nome, e-mail, telefone ou
            qualquer dado que identifique você pessoalmente.
          </p>
          <p className="mt-2">
            Quando você clica em uma oferta, registramos apenas: qual produto
            foi clicado, a data e hora, a página de origem e o navegador
            utilizado. Não armazenamos endereço IP. Esses dados são usados
            somente para entender quais ofertas são úteis.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-ink-900">Links de afiliados</h2>
          <p className="mt-2">
            Alguns links deste site são links de afiliados. Ao clicar, você é
            direcionado para a loja parceira, que pode registrar cookies
            próprios conforme a política dela. Se você comprar, podemos receber
            uma comissão — sem custo adicional para você.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-ink-900">Lojas parceiras</h2>
          <p className="mt-2">
            Não temos controle sobre as práticas de privacidade das lojas de
            destino. Recomendamos consultar a política de cada uma.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-ink-900">Seus direitos</h2>
          <p className="mt-2">
            Conforme a LGPD (Lei nº 13.709/2018), você pode solicitar
            informações sobre os dados tratados por este site.
            {settings.contactEmail ? (
              <>
                {" "}
                Entre em contato pelo e-mail{" "}
                <a
                  href={`mailto:${settings.contactEmail}`}
                  className="font-semibold text-brand-700 hover:underline"
                >
                  {settings.contactEmail}
                </a>
                .
              </>
            ) : null}
          </p>
        </section>
      </div>
    </article>
  );
}
