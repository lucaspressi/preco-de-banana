"use client";

import { useEffect, useState } from "react";

interface CountdownBadgeProps {
  expiresAt: string;
}

interface Remaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function remaining(target: number): Remaining | null {
  const diff = target - Date.now();
  if (diff <= 0) return null;

  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Contador regressivo das ofertas relampago.
 *
 * Comeca como null (igual no servidor e no cliente) para nao divergir na
 * hidratacao - o relogio do cliente nunca bate exatamente com o do servidor.
 * O primeiro valor chega no intervalo, ja dentro do efeito.
 */
export function CountdownBadge({ expiresAt }: CountdownBadgeProps) {
  const [time, setTime] = useState<Remaining | null>(null);

  useEffect(() => {
    const target = new Date(expiresAt).getTime();

    // Agenda no proximo tick: evita setState sincrono no corpo do efeito.
    const id = setInterval(() => {
      setTime(remaining(target));
    }, 1000);

    return () => clearInterval(id);
  }, [expiresAt]);

  if (!time) return null;

  return (
    <p
      className="flex items-center justify-center gap-1 rounded-lg bg-ink-900/5 px-2 py-1.5 text-[11px] font-semibold text-ink-700"
      aria-live="off"
    >
      <span aria-hidden="true">⏱</span>
      <span>
        Termina em{" "}
        <time dateTime={expiresAt} className="font-mono tabular-nums">
          {time.days > 0 && `${time.days}d `}
          {pad(time.hours)}:{pad(time.minutes)}:{pad(time.seconds)}
        </time>
      </span>
    </p>
  );
}
