import { CrudManager, type CrudField } from "@/components/admin/crud-manager";
import { prisma } from "@/lib/prisma";

import { deleteTestimonialAction, saveTestimonialAction } from "./actions";

export const dynamic = "force-dynamic";

const FIELDS: CrudField[] = [
  {
    name: "authorName",
    label: "Nome de quem enviou",
    required: true,
    placeholder: "Carlos M.",
  },
  {
    name: "content",
    label: "Depoimento",
    type: "textarea",
    required: true,
    placeholder: "O que a pessoa realmente escreveu.",
  },
  {
    name: "rating",
    label: "Nota (1 a 5)",
    type: "number",
    min: 1,
    max: 5,
    hint: "Opcional. Deixe vazio para não exibir estrelas.",
  },
  { name: "avatarUrl", label: "URL do avatar", type: "url" },
  { name: "priority", label: "Prioridade", type: "number", min: 0, max: 9999 },
  { name: "isActive", label: "Exibir no site", type: "checkbox" },
];

export default async function AdminTestimonialsPage() {
  const testimonials = await prisma.testimonial.findMany({
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-2xl font-extrabold text-ink-900">
          Depoimentos
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Cadastre apenas depoimentos reais de membros do grupo.
        </p>
      </header>

      <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm text-amber-900">
          A seção de depoimentos só aparece no site quando existe pelo menos um
          registro ativo. Enquanto estiver vazia, ela fica oculta — o site nunca
          exibe avaliações inventadas.
        </p>
      </div>

      <CrudManager
        fields={FIELDS}
        saveAction={saveTestimonialAction}
        deleteAction={deleteTestimonialAction}
        addLabel="+ Novo depoimento"
        emptyMessage="Nenhum depoimento cadastrado. A seção está oculta no site."
        items={testimonials.map((testimonial) => ({
          id: testimonial.id,
          title: testimonial.authorName,
          subtitle: testimonial.content.slice(0, 90),
          meta: [
            testimonial.isActive ? "Ativo" : "Inativo",
            testimonial.rating ? `${testimonial.rating}/5` : null,
          ]
            .filter(Boolean)
            .join(" • "),
          values: {
            authorName: testimonial.authorName,
            content: testimonial.content,
            rating: testimonial.rating?.toString() ?? "",
            avatarUrl: testimonial.avatarUrl ?? "",
            priority: String(testimonial.priority),
            isActive: testimonial.isActive,
          },
        }))}
      />
    </div>
  );
}
