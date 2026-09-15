"use client";

import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  requestCodeAction,
  verifyCodeAction,
  type LoginState,
} from "./actions";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-accent-500 px-4 py-3 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

function EmailStep({ next }: { next: string }) {
  const [state, action] = useActionState<LoginState, FormData>(
    requestCodeAction,
    { step: "email" },
  );

  // Ao receber o codigo, troca para a etapa de verificacao.
  if (state.step === "code" && state.email) {
    return <CodeStep next={next} email={state.email} notice={state.notice} />;
  }

  return (
    <form action={action} className="mt-6 space-y-4">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-ink-700">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          autoFocus
          className={inputClass}
          placeholder="voce@exemplo.com"
        />
      </div>

      {state.error && (
        <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
          {state.error}
        </p>
      )}

      <SubmitButton label="Enviar código" pendingLabel="Enviando..." />

      <p className="text-center text-xs text-ink-500">
        Enviamos um código de 6 dígitos. Sem senha para memorizar.
      </p>
    </form>
  );
}

function CodeStep({
  next,
  email,
  notice,
}: {
  next: string;
  email: string;
  notice?: string;
}) {
  const [state, action] = useActionState<LoginState, FormData>(
    verifyCodeAction,
    { step: "code", email, notice },
  );

  const message = state.notice ?? notice;

  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="next" value={next} />

      {message && !state.error && (
        <p role="status" className="rounded-xl bg-green-50 px-3.5 py-2.5 text-sm text-green-800">
          {message}
        </p>
      )}

      <div>
        <label htmlFor="code" className="mb-1.5 block text-xs font-semibold text-ink-700">
          Código enviado para <span className="font-bold">{email}</span>
        </label>
        <input
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          required
          autoFocus
          className={`${inputClass} text-center font-mono text-2xl tracking-[0.5em]`}
          placeholder="000000"
        />
      </div>

      {state.error && (
        <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
          {state.error}
        </p>
      )}

      <SubmitButton label="Entrar" pendingLabel="Verificando..." />

      <p className="text-center text-xs text-ink-500">
        O código vale por 10 minutos.{" "}
        <a href="/admin/login" className="font-semibold text-brand-700 hover:underline">
          Usar outro e-mail
        </a>
      </p>
    </form>
  );
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";

  return <EmailStep next={next} />;
}
