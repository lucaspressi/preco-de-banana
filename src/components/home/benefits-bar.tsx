import {
  BoltIcon,
  GiftIcon,
  ShieldIcon,
  TagIcon,
  UsersIcon,
} from "@/components/icons";

const BENEFITS = [
  {
    icon: TagIcon,
    title: "Descontos de verdade",
    description: "Ofertas selecionadas a dedo",
  },
  {
    icon: BoltIcon,
    title: "Promoções relâmpago",
    description: "Oportunidades por tempo limitado",
  },
  {
    icon: ShieldIcon,
    title: "Lojas confiáveis",
    description: "Produtos originais e verificados",
  },
  {
    icon: UsersIcon,
    title: "Grupo ativo",
    description: "Novas ofertas o dia inteiro para você",
  },
  {
    icon: GiftIcon,
    title: "Cupons exclusivos",
    description: "Só quem está no grupo recebe",
  },
] as const;

/** Faixa azul de beneficios, logo abaixo da hero. */
export function BenefitsBar() {
  return (
    <section
      aria-label="Benefícios do grupo"
      className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
    >
      <div className="rounded-2xl bg-brand-600 px-4 py-6 sm:px-6 lg:rounded-3xl">
        <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-5 lg:divide-x lg:divide-white/20">
          {BENEFITS.map(({ icon: Icon, title, description }) => (
            <li
              key={title}
              className="flex items-start gap-3 lg:justify-center lg:px-3"
            >
              <Icon className="h-7 w-7 shrink-0 text-white/90" />
              <div className="min-w-0">
                <h3 className="text-[11px] font-extrabold uppercase leading-tight tracking-wide text-white sm:text-xs">
                  {title}
                </h3>
                <p className="mt-1 text-[11px] leading-snug text-white/75">
                  {description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
