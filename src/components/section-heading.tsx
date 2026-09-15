import Link from "next/link";

import { ArrowRightIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  /** Parte em tom escuro. */
  title: string;
  /** Parte destacada em azul (opcional). */
  highlight?: string;
  subtitle?: string;
  href?: string;
  hrefLabel?: string;
  className?: string;
  id?: string;
}

export function SectionHeading({
  title,
  highlight,
  subtitle,
  href,
  hrefLabel = "Ver todas",
  className,
  id,
}: SectionHeadingProps) {
  return (
    <div className={cn("mb-7 text-center", className)}>
      <h2
        id={id}
        className="font-display text-2xl font-extrabold uppercase tracking-tight text-ink-900 sm:text-3xl"
      >
        {title}
        {highlight && <span className="text-brand-600"> {highlight}</span>}
      </h2>

      {subtitle && (
        <p className="mx-auto mt-2 max-w-2xl text-sm text-ink-500 sm:text-base">
          {subtitle}
        </p>
      )}

      {href && (
        <Link
          href={href}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-brand-700 hover:underline"
        >
          {hrefLabel}
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
