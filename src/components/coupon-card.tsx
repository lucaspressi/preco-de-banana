"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { CheckIcon, CopyIcon } from "@/components/icons";
import { formatDate } from "@/lib/utils";

interface CouponCardProps {
  coupon: {
    id: string;
    title: string;
    code: string;
    description: string | null;
    discount: string | null;
    affiliateUrl: string | null;
    expiresAt: Date | null;
    store: { name: string; slug: string; logoUrl: string | null } | null;
  };
}

export function CouponCard({ coupon }: CouponCardProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2500);
    return () => clearTimeout(timer);
  }, [copied]);

  async function handleGetCoupon() {
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopied(true);
    } catch {
      // Clipboard bloqueado (http, permissao negada): o codigo continua
      // visivel na tela para copia manual.
      setCopied(false);
    }

    if (coupon.affiliateUrl) {
      window.open(coupon.affiliateUrl, "_blank", "noopener,noreferrer");
    }
  }

  const expires = formatDate(coupon.expiresAt);

  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-card-hover)]">
      <div className="flex items-start justify-between gap-3">
        {coupon.store ? (
          coupon.store.logoUrl ? (
            <Image
              src={coupon.store.logoUrl}
              alt={coupon.store.name}
              width={90}
              height={28}
              className="max-h-7 w-auto object-contain"
              loading="lazy"
            />
          ) : (
            <span className="text-sm font-extrabold text-ink-900">
              {coupon.store.name}
            </span>
          )
        ) : (
          <span />
        )}

        {coupon.discount && (
          <span className="shrink-0 rounded-full bg-brand-400 px-3 py-1 text-xs font-extrabold text-ink-900">
            {coupon.discount}
          </span>
        )}
      </div>

      <h3 className="mt-3 text-base font-bold leading-snug text-ink-900">
        {coupon.title}
      </h3>

      {coupon.description && (
        <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
          {coupon.description}
        </p>
      )}

      <div className="mt-4 rounded-xl border-2 border-dashed border-brand-200 bg-brand-50 px-4 py-3 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">
          Cupom
        </p>
        <p className="font-mono text-lg font-extrabold tracking-wider text-brand-700">
          {coupon.code}
        </p>
      </div>

      <button
        type="button"
        onClick={handleGetCoupon}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-brand-700"
      >
        {copied ? (
          <>
            <CheckIcon className="h-4 w-4" />
            Código copiado!
          </>
        ) : (
          <>
            <CopyIcon className="h-4 w-4" />
            Pegar cupom
          </>
        )}
      </button>

      {/* Feedback tambem por leitor de tela */}
      <span aria-live="polite" className="sr-only">
        {copied ? `Código ${coupon.code} copiado.` : ""}
      </span>

      {expires && (
        <p className="mt-2 text-center text-[11px] text-slate-400">
          Válido até {expires}
        </p>
      )}
    </article>
  );
}
