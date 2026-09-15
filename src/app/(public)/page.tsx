import { BenefitsBar } from "@/components/home/benefits-bar";
import { CategoriesGrid } from "@/components/home/categories-grid";
import { FinalCta } from "@/components/home/final-cta";
import { Hero } from "@/components/home/hero";
import { StoresStrip } from "@/components/home/stores-strip";
import { Testimonials } from "@/components/home/testimonials";
import { EmptyState } from "@/components/empty-state";
import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/section-heading";
import { TelegramButton } from "@/components/telegram-button";
import {
  getActiveCategories,
  getActiveStores,
  getActiveTestimonials,
  getFeaturedProducts,
  getFlashDeals,
} from "@/lib/queries";
import { PromoFeedGrid } from "@/components/home/promo-feed-grid";
import { fetchPromoProducts } from "@/lib/promo-feed";
import { getSiteSettings } from "@/lib/settings";

/*
  Renderizada sob demanda.

  As consultas por tras usam unstable_cache com tags, entao na pratica quase
  todo request e servido de cache - mas produtos recem-publicados aparecem
  imediatamente, e ofertas relampago expiram na hora certa. Uma pagina
  estatica com ISR mostraria a home vazia por ate 5 minutos apos o deploy.
*/
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [settings, featured, flashDeals, categories, stores, testimonials] =
    await Promise.all([
      getSiteSettings(),
      getFeaturedProducts(8),
      getFlashDeals(4),
      getActiveCategories(),
      getActiveStores(),
      getActiveTestimonials(3),
    ]);

  // Feed externo: falha nunca derruba a home - retorna lista vazia.
  const promoProducts = await fetchPromoProducts({
    limit: 8,
    sort: "discount",
  });

  return (
    <>
      <Hero
        title={settings.heroTitle}
        subtitle={settings.heroSubtitle}
        telegramUrl={settings.telegramUrl}
      />

      <div className="mt-4 lg:mt-2">
        <BenefitsBar />
      </div>

      {/* Ofertas em destaque */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <SectionHeading
          title="Ofertas em"
          highlight="destaque"
          subtitle="Produtos escolhidos a dedo para você economizar de verdade."
          href={featured.length > 0 ? "/ofertas" : undefined}
        />

        {featured.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                priority={index < 4}
              />
            ))}
          </div>
        ) : (
          promoProducts.length === 0 && (
            <EmptyState
              title="Nenhuma oferta publicada ainda"
              description="Assim que você cadastrar produtos no painel administrativo, eles aparecem aqui automaticamente."
            />
          )
        )}
      </section>

      {/* Ofertas do monitor de precos (feed externo) */}
      {promoProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeading
            title="Ofertas de"
            highlight="hoje"
            subtitle="Selecionadas especialmente para você!"
          />
          <PromoFeedGrid products={promoProducts} />
        </section>
      )}

      {/* Ofertas relampago */}
      {flashDeals.length > 0 && (
        <section className="bg-brand-50/60 py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              title="Ofertas"
              highlight="relâmpago"
              subtitle="Promoções por tempo limitado. Quando o tempo acaba, a oferta sai do ar."
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {flashDeals.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  variant="flash"
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categorias */}
      <section
        id="categorias"
        className="mx-auto max-w-7xl scroll-mt-24 px-4 py-12 sm:px-6 lg:px-8"
      >
        <SectionHeading
          title="Produtos que sempre"
          highlight="recomendamos"
          subtitle="Ofertas selecionadas das melhores categorias para você economizar muito!"
        />
        <CategoriesGrid categories={categories} />
      </section>

      {/* Lojas */}
      {stores.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeading
            title="Ofertas das melhores"
            highlight="lojas"
            subtitle="Trabalhamos com lojas conhecidas e confiáveis."
          />
          <StoresStrip stores={stores} />

          {settings.telegramUrl && (
            <div className="mt-6 flex justify-center">
              <TelegramButton href={settings.telegramUrl} size="md">
                Ver todos os cupons no grupo
              </TelegramButton>
            </div>
          )}
        </section>
      )}

      <Testimonials testimonials={testimonials} />

      <FinalCta telegramUrl={settings.telegramUrl} />
    </>
  );
}
