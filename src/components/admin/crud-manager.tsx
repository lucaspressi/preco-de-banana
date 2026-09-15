"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

export interface CrudFieldOption {
  value: string;
  label: string;
}

export interface CrudField {
  name: string;
  label: string;
  type?:
    | "text"
    | "url"
    | "textarea"
    | "number"
    | "checkbox"
    | "select"
    | "datetime-local";
  placeholder?: string;
  required?: boolean;
  hint?: string;
  options?: CrudFieldOption[];
  min?: number;
  max?: number;
}

export interface CrudItem {
  id: string;
  title: string;
  subtitle?: string;
  meta?: string;
  values: Record<string, string | boolean>;
}

interface CrudState {
  error?: string;
  success?: string;
}

interface CrudManagerProps {
  fields: CrudField[];
  items: CrudItem[];
  saveAction: (prev: CrudState, formData: FormData) => Promise<CrudState>;
  deleteAction: (formData: FormData) => Promise<void>;
  addLabel: string;
  emptyMessage: string;
  deleteWarning?: string;
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

const labelClass = "mb-1.5 block text-xs font-semibold text-ink-700";

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Salvando..." : "Salvar"}
    </button>
  );
}

function FieldInput({
  field,
  defaultValue,
}: {
  field: CrudField;
  defaultValue?: string | boolean;
}) {
  const id = `campo-${field.name}`;

  if (field.type === "checkbox") {
    return (
      <label className="flex items-center gap-2.5 text-sm text-ink-900">
        <input
          type="checkbox"
          name={field.name}
          defaultChecked={Boolean(defaultValue)}
          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
        />
        {field.label}
      </label>
    );
  }

  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {field.label}
        {field.required && " *"}
      </label>

      {field.type === "textarea" ? (
        <textarea
          id={id}
          name={field.name}
          rows={3}
          required={field.required}
          defaultValue={String(defaultValue ?? "")}
          placeholder={field.placeholder}
          className={inputClass}
        />
      ) : field.type === "select" ? (
        <select
          id={id}
          name={field.name}
          defaultValue={String(defaultValue ?? "")}
          className={inputClass}
        >
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          name={field.name}
          type={field.type ?? "text"}
          required={field.required}
          min={field.min}
          max={field.max}
          defaultValue={String(defaultValue ?? "")}
          placeholder={field.placeholder}
          className={inputClass}
        />
      )}

      {field.hint && (
        <p className="mt-1 text-[11px] text-slate-400">{field.hint}</p>
      )}
    </div>
  );
}

/**
 * CRUD inline reutilizavel (categorias, lojas, cupons, depoimentos).
 *
 * Mantem a edicao na mesma tela da listagem - fluxo mais direto para
 * entidades simples do que navegar entre paginas.
 */
export function CrudManager({
  fields,
  items,
  saveAction,
  deleteAction,
  addLabel,
  emptyMessage,
  deleteWarning,
}: CrudManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [state, formAction] = useActionState<CrudState, FormData>(
    saveAction,
    {},
  );

  const editing = items.find((item) => item.id === editingId);

  function renderForm(item?: CrudItem) {
    return (
      <form
        action={formAction}
        className="rounded-2xl border border-brand-200 bg-brand-50/60 p-5"
        key={item?.id ?? "novo"}
      >
        {item && <input type="hidden" name="id" value={item.id} />}

        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((field) => (
            <div
              key={field.name}
              className={
                field.type === "textarea" ? "sm:col-span-2" : undefined
              }
            >
              <FieldInput field={field} defaultValue={item?.values[field.name]} />
            </div>
          ))}
        </div>

        {state.error && (
          <p
            role="alert"
            className="mt-4 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700"
          >
            {state.error}
          </p>
        )}

        <div className="mt-5 flex items-center gap-3">
          <SaveButton />
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setCreating(false);
            }}
            className="text-sm font-semibold text-ink-500 hover:text-ink-900"
          >
            Cancelar
          </button>
        </div>
      </form>
    );
  }

  return (
    <div>
      {state.success && !creating && !editingId && (
        <p
          role="status"
          className="mb-5 rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-800"
        >
          {state.success}
        </p>
      )}

      {!creating && !editingId && (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="mb-5 rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold uppercase tracking-wide text-white hover:bg-brand-700"
        >
          {addLabel}
        </button>
      )}

      {creating && <div className="mb-5">{renderForm()}</div>}

      {items.length === 0 && !creating ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
          <p className="text-sm text-ink-500">{emptyMessage}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) =>
            editingId === item.id ? (
              <li key={item.id}>{renderForm(editing)}</li>
            ) : (
              <li
                key={item.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[var(--shadow-card)] sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink-900">
                    {item.title}
                  </p>
                  {item.subtitle && (
                    <p className="mt-0.5 truncate text-xs text-ink-500">
                      {item.subtitle}
                    </p>
                  )}
                  {item.meta && (
                    <p className="mt-1 text-[11px] text-slate-400">
                      {item.meta}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(item.id);
                      setCreating(false);
                    }}
                    className="rounded-lg bg-slate-100 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-700 hover:bg-slate-200"
                  >
                    Editar
                  </button>

                  <form action={deleteAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <ConfirmSubmitButton
                      message={
                        deleteWarning
                          ? `Excluir "${item.title}"? ${deleteWarning}`
                          : `Excluir "${item.title}"?`
                      }
                      className="rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-red-600 hover:bg-red-50"
                    >
                      Excluir
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}
