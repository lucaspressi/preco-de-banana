import { CrudManager, type CrudField } from "@/components/admin/crud-manager";
import { prisma } from "@/lib/prisma";

import { deleteStoreAction, saveStoreAction } from "./actions";

export const dynamic = "force-dynamic";

const FIELDS: CrudField[] = [
  { name: "name", label: "Nome", required: true, placeholder: "Amazon" },
  {
    name: "slug",
    label: "Slug",
    hint: "Deixe vazio para gerar a partir do nome.",
    placeholder: "amazon",
  },
  {
    name: "logoUrl",
    label: "URL do logo",
    type: "url",
    hint: "Use a imagem oficial fornecida pelo programa de afiliados.",
  },
  { name: "url", label: "Site da loja", type: "url" },
  { name: "priority", label: "Prioridade", type: "number", min: 0, max: 9999 },
  { name: "isActive", label: "Loja ativa", type: "checkbox" },
];

export default async function AdminStoresPage() {
  const stores = await prisma.store.findMany({
    orderBy: [{ priority: "desc" }, { name: "asc" }],
    include: { _count: { select: { products: true, coupons: true } } },
  });

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-2xl font-extrabold text-ink-900">
          Lojas
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Lojas parceiras exibidas no site e vinculadas aos produtos.
        </p>
      </header>

      <CrudManager
        fields={FIELDS}
        saveAction={saveStoreAction}
        deleteAction={deleteStoreAction}
        addLabel="+ Nova loja"
        emptyMessage="Nenhuma loja cadastrada."
        deleteWarning="Os produtos dessa loja ficarão sem loja, mas não serão excluídos."
        items={stores.map((store) => ({
          id: store.id,
          title: store.name,
          subtitle: `/loja/${store.slug}`,
          meta: [
            store.isActive ? "Ativa" : "Inativa",
            `${store._count.products} ${
              store._count.products === 1 ? "produto" : "produtos"
            }`,
            `${store._count.coupons} ${
              store._count.coupons === 1 ? "cupom" : "cupons"
            }`,
          ].join(" • "),
          values: {
            name: store.name,
            slug: store.slug,
            logoUrl: store.logoUrl ?? "",
            url: store.url ?? "",
            priority: String(store.priority),
            isActive: store.isActive,
          },
        }))}
      />
    </div>
  );
}
