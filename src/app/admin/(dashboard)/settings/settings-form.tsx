"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { SiteSettingsData } from "@/lib/settings";

import { saveSettingsAction, type SettingsState } from "./actions";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

const labelClass = "mb-1.5 block text-xs font-semibold text-ink-700";

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Salvando..." : "Salvar configurações"}
    </button>
  );
}

export function SettingsForm({ settings }: { settings: SiteSettingsData }) {
  const [state, formAction] = useActionState<SettingsState, FormData>(
    saveSettingsAction,
    {},
  );

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      {state.error && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700"
        >
          {state.error}
        </p>
      )}

      {state.success && (
        <p
          role="status"
          className="rounded-xl bg-green-50 px-3.5 py-2.5 text-sm font-medium text-green-800"
        >
          {state.success}
        </p>
      )}

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5">
        <h2 className="mb-4 text-sm font-extrabold uppercase tracking-wide text-ink-900">
          Telegram e redes
        </h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="telegramUrl" className={labelClass}>
              Link do grupo do Telegram
            </label>
            <input
              id="telegramUrl"
              name="telegramUrl"
              type="url"
              defaultValue={settings.telegramUrl}
              className={inputClass}
              placeholder="https://t.me/seugrupo"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Usado em todos os botões do site. Enquanto estiver vazio, os CTAs
              ficam ocultos.
            </p>
          </div>

          <div>
            <label htmlFor="instagramUrl" className={labelClass}>
              Instagram
            </label>
            <input
              id="instagramUrl"
              name="instagramUrl"
              type="url"
              defaultValue={settings.instagramUrl ?? ""}
              className={inputClass}
              placeholder="https://instagram.com/..."
            />
          </div>

          <div>
            <label htmlFor="youtubeUrl" className={labelClass}>
              YouTube
            </label>
            <input
              id="youtubeUrl"
              name="youtubeUrl"
              type="url"
              defaultValue={settings.youtubeUrl ?? ""}
              className={inputClass}
              placeholder="https://youtube.com/@..."
            />
          </div>

          <div>
            <label htmlFor="contactEmail" className={labelClass}>
              E-mail de contato
            </label>
            <input
              id="contactEmail"
              name="contactEmail"
              type="email"
              defaultValue={settings.contactEmail ?? ""}
              className={inputClass}
              placeholder="contato@..."
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5">
        <h2 className="mb-4 text-sm font-extrabold uppercase tracking-wide text-ink-900">
          Hero (topo da home)
        </h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="heroTitle" className={labelClass}>
              Título *
            </label>
            <input
              id="heroTitle"
              name="heroTitle"
              required
              defaultValue={settings.heroTitle}
              className={inputClass}
            />
            <p className="mt-1 text-[11px] text-slate-400">
              A primeira palavra fica escura; o restante, em azul.
            </p>
          </div>

          <div>
            <label htmlFor="heroSubtitle" className={labelClass}>
              Subtítulo
            </label>
            <textarea
              id="heroSubtitle"
              name="heroSubtitle"
              rows={2}
              defaultValue={settings.heroSubtitle}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5">
        <h2 className="mb-4 text-sm font-extrabold uppercase tracking-wide text-ink-900">
          Identidade e SEO
        </h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="siteName" className={labelClass}>
              Nome do site *
            </label>
            <input
              id="siteName"
              name="siteName"
              required
              defaultValue={settings.siteName}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="siteDescription" className={labelClass}>
              Descrição (meta description)
            </label>
            <textarea
              id="siteDescription"
              name="siteDescription"
              rows={2}
              defaultValue={settings.siteDescription}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <SaveButton />
    </form>
  );
}
