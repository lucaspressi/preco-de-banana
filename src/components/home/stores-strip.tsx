import Image from "next/image";
import Link from "next/link";

interface StoreItem {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
}

interface StoresStripProps {
  stores: StoreItem[];
}

/**
 * Faixa de lojas parceiras.
 *
 * O logo vem de Store.logoUrl (cadastrado no admin). Sem logo, exibimos o
 * nome em tipografia - evita versionar marcas de terceiros no repositorio.
 */
export function StoresStrip({ stores }: StoresStripProps) {
  if (stores.length === 0) return null;

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {stores.map((store) => (
        <li key={store.id}>
          <Link
            href={`/loja/${store.slug}`}
            className="flex h-20 items-center justify-center rounded-xl border border-slate-200/80 bg-white px-4 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-card-hover)]"
          >
            {store.logoUrl ? (
              <Image
                src={store.logoUrl}
                alt={store.name}
                width={120}
                height={40}
                className="max-h-10 w-auto object-contain"
                loading="lazy"
              />
            ) : (
              <span className="text-center text-sm font-extrabold text-ink-700">
                {store.name}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
