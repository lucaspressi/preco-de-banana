import { CrudManager, type CrudField } from "@/components/admin/crud-manager";
import { prisma } from "@/lib/prisma";

import { deleteCategoryAction, saveCategoryAction } from "./actions";

export const dynamic = "force-dynamic";

const FIELDS: CrudField[] = [
  { name: "name", label: "Nome", required: true, placeholder: "Eletrônicos" },
  {
    name: "slug",
    label: "Slug",
    hint: "Deixe vazio para gerar a partir do nome.",
    placeholder: "eletronicos",
  },
  {
    name: "description",
    label: "Descrição curta",
    type: "textarea",
    placeholder: "Tecnologia, celulares, notebooks e mais",
  },
  {
    name: "icon",
    label: "Ícone",
    hint: "smartphone, lightbulb, sparkles, shirt, chef-hat, dumbbell, gamepad, sofa",
    placeholder: "smartphone",
  },
  { name: "imageUrl", label: "URL da imagem", type: "url" },
  { name: "priority", label: "Prioridade", type: "number", min: 0, max: 9999 },
  { name: "isActive", label: "Categoria ativa", type: "checkbox" },
];

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: [{ priority: "desc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-2xl font-extrabold text-ink-900">
          Categorias
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Organize os produtos em categorias exibidas na home.
        </p>
      </header>

      <CrudManager
        fields={FIELDS}
        saveAction={saveCategoryAction}
        deleteAction={deleteCategoryAction}
        addLabel="+ Nova categoria"
        emptyMessage="Nenhuma categoria cadastrada."
        deleteWarning="Os produtos dessa categoria ficarão sem categoria, mas não serão excluídos."
        items={categories.map((category) => ({
          id: category.id,
          title: category.name,
          subtitle: `/categoria/${category.slug}`,
          meta: [
            category.isActive ? "Ativa" : "Inativa",
            `${category._count.products} ${
              category._count.products === 1 ? "produto" : "produtos"
            }`,
            `Prioridade ${category.priority}`,
          ].join(" • "),
          values: {
            name: category.name,
            slug: category.slug,
            description: category.description ?? "",
            icon: category.icon ?? "",
            imageUrl: category.imageUrl ?? "",
            priority: String(category.priority),
            isActive: category.isActive,
          },
        }))}
      />
    </div>
  );
}
