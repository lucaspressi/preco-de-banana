"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface FilterOption {
  slug: string;
  name: string;
}

interface ProductFiltersProps {
  categories: FilterOption[];
  stores: FilterOption[];
  /** Oculta o seletor quando ja estamos numa pagina de categoria/loja. */
  hideCategory?: boolean;
  hideStore?: boolean;
}

const SORT_OPTIONS = [
  { value: "", label: "Relevância" },
  { value: "discount", label: "Maior desconto" },
  { value: "price-asc", label: "Menor preço" },
  { value: "price-desc", label: "Maior preço" },
  { value: "recent", label: "Mais recentes" },
] as const;

const selectClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

export function ProductFilters({
  categories,
  stores,
  hideCategory,
  hideStore,
}: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const hasActiveFilters = [
    "categoria",
    "loja",
    "sort",
    "min",
    "max",
    "q",
  ].some((key) => searchParams.get(key));

  return (
    <aside
      aria-label="Filtros"
      className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[var(--shadow-card)]"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-ink-900">
          Filtrar
        </h2>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => router.push("?", { scroll: false })}
            className="text-xs font-semibold text-brand-700 hover:underline"
          >
            Limpar
          </button>
        )}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        {!hideCategory && categories.length > 0 && (
          <div>
            <label
              htmlFor="filtro-categoria"
              className="mb-1.5 block text-xs font-semibold text-ink-700"
            >
              Categoria
            </label>
            <select
              id="filtro-categoria"
              className={selectClass}
              value={searchParams.get("categoria") ?? ""}
              onChange={(event) => updateParam("categoria", event.target.value)}
            >
              <option value="">Todas</option>
              {categories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {!hideStore && stores.length > 0 && (
          <div>
            <label
              htmlFor="filtro-loja"
              className="mb-1.5 block text-xs font-semibold text-ink-700"
            >
              Loja
            </label>
            <select
              id="filtro-loja"
              className={selectClass}
              value={searchParams.get("loja") ?? ""}
              onChange={(event) => updateParam("loja", event.target.value)}
            >
              <option value="">Todas</option>
              {stores.map((store) => (
                <option key={store.slug} value={store.slug}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label
            htmlFor="filtro-ordem"
            className="mb-1.5 block text-xs font-semibold text-ink-700"
          >
            Ordenar por
          </label>
          <select
            id="filtro-ordem"
            className={selectClass}
            value={searchParams.get("sort") ?? ""}
            onChange={(event) => updateParam("sort", event.target.value)}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <fieldset>
          <legend className="mb-1.5 block text-xs font-semibold text-ink-700">
            Faixa de preço (R$)
          </legend>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="Mín"
              aria-label="Preço mínimo"
              defaultValue={searchParams.get("min") ?? ""}
              onBlur={(event) => updateParam("min", event.target.value)}
              className={selectClass}
            />
            <span aria-hidden="true" className="text-slate-400">
              –
            </span>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="Máx"
              aria-label="Preço máximo"
              defaultValue={searchParams.get("max") ?? ""}
              onBlur={(event) => updateParam("max", event.target.value)}
              className={selectClass}
            />
          </div>
        </fieldset>
      </div>
    </aside>
  );
}
