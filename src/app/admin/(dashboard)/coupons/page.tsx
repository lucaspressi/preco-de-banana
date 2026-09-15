import { CrudManager, type CrudField } from "@/components/admin/crud-manager";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

import { deleteCouponAction, saveCouponAction } from "./actions";

export const dynamic = "force-dynamic";

function toDatetimeLocal(date: Date | null): string {
  if (!date) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default async function AdminCouponsPage() {
  const [coupons, stores] = await Promise.all([
    prisma.coupon.findMany({
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      include: { store: { select: { name: true } } },
    }),
    prisma.store.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const fields: CrudField[] = [
    {
      name: "title",
      label: "Título",
      required: true,
      placeholder: "20% OFF em eletrônicos",
    },
    { name: "code", label: "Código", required: true, placeholder: "PROMO20" },
    {
      name: "discount",
      label: "Desconto (texto)",
      placeholder: "20% OFF",
      hint: "Texto livre exibido no card.",
    },
    { name: "description", label: "Descrição", type: "textarea" },
    {
      name: "storeId",
      label: "Loja",
      type: "select",
      options: [
        { value: "", label: "Sem loja" },
        ...stores.map((store) => ({ value: store.id, label: store.name })),
      ],
    },
    { name: "affiliateUrl", label: "Link de afiliado", type: "url" },
    { name: "expiresAt", label: "Expira em", type: "datetime-local" },
    { name: "priority", label: "Prioridade", type: "number", min: 0, max: 9999 },
    { name: "isActive", label: "Cupom ativo", type: "checkbox" },
  ];

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-2xl font-extrabold text-ink-900">
          Cupons
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Cupons exibidos em /cupons. Expirados somem automaticamente.
        </p>
      </header>

      <CrudManager
        fields={fields}
        saveAction={saveCouponAction}
        deleteAction={deleteCouponAction}
        addLabel="+ Novo cupom"
        emptyMessage="Nenhum cupom cadastrado."
        items={coupons.map((coupon) => ({
          id: coupon.id,
          title: coupon.title,
          subtitle: `${coupon.code}${
            coupon.store ? ` • ${coupon.store.name}` : ""
          }`,
          meta: [
            coupon.isActive ? "Ativo" : "Inativo",
            coupon.discount,
            coupon.expiresAt
              ? `Expira em ${formatDate(coupon.expiresAt)}`
              : null,
          ]
            .filter(Boolean)
            .join(" • "),
          values: {
            title: coupon.title,
            code: coupon.code,
            discount: coupon.discount ?? "",
            description: coupon.description ?? "",
            storeId: coupon.storeId ?? "",
            affiliateUrl: coupon.affiliateUrl ?? "",
            expiresAt: toDatetimeLocal(coupon.expiresAt),
            priority: String(coupon.priority),
            isActive: coupon.isActive,
          },
        }))}
      />
    </div>
  );
}
