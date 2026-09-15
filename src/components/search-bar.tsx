"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { SearchIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  compact?: boolean;
  className?: string;
  onNavigate?: () => void;
}

export function SearchBar({ compact, className, onNavigate }: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [term, setTerm] = useState(searchParams.get("q") ?? "");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = term.trim();
    router.push(trimmed ? `/ofertas?q=${encodeURIComponent(trimmed)}` : "/ofertas");
    onNavigate?.();
  }

  const inputId = compact ? "busca-header" : "busca-principal";

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className={cn("relative w-full", className)}
    >
      <label htmlFor={inputId} className="sr-only">
        O que você está procurando?
      </label>
      <SearchIcon
        className={cn(
          "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400",
          compact ? "h-4 w-4" : "h-5 w-5",
        )}
      />
      <input
        id={inputId}
        type="search"
        name="q"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        placeholder="O que você está procurando?"
        className={cn(
          "w-full rounded-xl border border-slate-200 bg-white text-ink-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30",
          compact ? "py-2 pl-9 pr-3 text-sm" : "py-3.5 pl-11 pr-28 text-base",
        )}
      />
      {!compact && (
        <button
          type="submit"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-brand-600 px-5 py-2 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-brand-700"
        >
          Buscar
        </button>
      )}
    </form>
  );
}
