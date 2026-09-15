import Image from "next/image";
import Link from "next/link";

import { ArrowRightIcon, CategoryIcon } from "@/components/icons";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  imageUrl: string | null;
  _count: { products: number };
}

interface CategoriesGridProps {
  categories: CategoryItem[];
}

export function CategoriesGrid({ categories }: CategoriesGridProps) {
  if (categories.length === 0) return null;

  return (
    <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {categories.map((category) => (
        <li key={category.id}>
          <Link
            href={`/categoria/${category.slug}`}
            className="group flex h-full flex-col items-center rounded-2xl border border-slate-200/80 bg-white p-5 text-center shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-card-hover)]"
          >
            <h3 className="text-sm font-extrabold uppercase leading-tight tracking-wide text-brand-700">
              {category.name}
            </h3>

            {category.description && (
              <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-ink-500">
                {category.description}
              </p>
            )}

            <div className="my-4 flex h-24 w-full items-center justify-center">
              {category.imageUrl ? (
                <Image
                  src={category.imageUrl}
                  alt=""
                  width={140}
                  height={96}
                  className="h-full w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <CategoryIcon
                  name={category.icon}
                  className="h-14 w-14 text-brand-300 transition-transform duration-300 group-hover:scale-110"
                />
              )}
            </div>

            <span className="mt-auto inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-white transition-colors group-hover:bg-brand-700">
              Ver ofertas
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </span>

            {category._count.products > 0 && (
              <span className="mt-2 text-[11px] text-slate-400">
                {category._count.products}{" "}
                {category._count.products === 1 ? "produto" : "produtos"}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
