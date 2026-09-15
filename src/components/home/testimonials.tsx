import Image from "next/image";

import { StarIcon } from "@/components/icons";
import { SectionHeading } from "@/components/section-heading";

interface TestimonialItem {
  id: string;
  authorName: string;
  content: string;
  rating: number | null;
  avatarUrl: string | null;
}

interface TestimonialsProps {
  testimonials: TestimonialItem[];
}

/**
 * Depoimentos reais, cadastrados em /admin/testimonials.
 *
 * Se nao houver nenhum, a secao inteira desaparece - o site nunca exibe
 * avaliacoes ou numeros inventados.
 */
export function Testimonials({ testimonials }: TestimonialsProps) {
  if (testimonials.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <SectionHeading title="Quem já" highlight="economizou, aprova!" />

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((item) => (
          <li
            key={item.id}
            className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[var(--shadow-card)]"
          >
            <div className="flex items-center gap-3">
              {item.avatarUrl ? (
                <Image
                  src={item.avatarUrl}
                  alt=""
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full object-cover"
                  loading="lazy"
                />
              ) : (
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700"
                  aria-hidden="true"
                >
                  {item.authorName.charAt(0).toUpperCase()}
                </span>
              )}

              <div>
                <p className="text-sm font-bold text-ink-900">
                  {item.authorName}
                </p>
                {item.rating !== null && (
                  <p
                    className="flex gap-0.5"
                    aria-label={`Avaliação: ${item.rating} de 5`}
                  >
                    {Array.from({ length: 5 }, (_, index) => (
                      <StarIcon
                        key={index}
                        className={
                          index < item.rating!
                            ? "h-3.5 w-3.5 text-accent-500"
                            : "h-3.5 w-3.5 text-slate-200"
                        }
                      />
                    ))}
                  </p>
                )}
              </div>
            </div>

            <blockquote className="mt-3 text-sm leading-relaxed text-ink-500">
              {item.content}
            </blockquote>
          </li>
        ))}
      </ul>
    </section>
  );
}
