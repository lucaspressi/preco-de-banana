"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

import { cn, slugify } from "@/lib/utils";

import {
  createProductAction,
  updateProductAction,
  type ProductFormState,
} from "./actions";
import { ProductPreview } from "./product-preview";

interface Option {
  id: string;
  name: string;
  slug: string;
}

export interface ProductFormValues {
  id?: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  affiliateUrl: string;
  originalUrl: string;
  originalPrice: string;
  currentPrice: string;
  discountPercentage: string;
  couponCode: string;
  categoryId: string;
  storeId: string;
  isFeatured: boolean;
  isFlashDeal: boolean;
  isActive: boolean;
  priority: string;
  expiresAt: string;
}

interface ProductFormProps {
  categories: Option[];
  stores: Option[];
  initialValues?: ProductFormValues;
  mode: "create" | "edit";
}

const EMPTY: ProductFormValues = {
  name: "",
  slug: "",
  description: "",
  imageUrl: "",
  affiliateUrl: "",
  originalUrl: "",
  originalPrice: "",
  currentPrice: "",
  discountPercentage: "",
  couponCode: "",
  categoryId: "",
  storeId: "",
  isFeatured: false,
  isFlashDeal: false,
  isActive: true,
  priority: "0",
  expiresAt: "",
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

const labelClass = "mb-1.5 block text-xs font-semibold text-ink-700";

function SubmitButton({ mode }: { mode: "create" | "edit" }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
    >
      {pending
        ? "Salvando..."
        : mode === "create"
          ? "Publicar produto"
          : "Salvar alterações"}
    </button>
  );
}

export function ProductForm({
  categories,
  stores,
  initialValues,
  mode,
}: ProductFormProps) {
  const [values, setValues] = useState<ProductFormValues>(
    initialValues ?? EMPTY,
  );
  const [slugTouched, setSlugTouched] = useState(mode === "edit");

  const [importMode, setImportMode] = useState<"message" | "link">("message");
  const [importUrl, setImportUrl] = useState("");
  const [messageText, setMessageText] = useState("");
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<{
    text: string;
    tone: "ok" | "warn" | "error";
  } | null>(null);

  const action = mode === "create" ? createProductAction : updateProductAction;
  const [state, formAction] = useActionState<ProductFormState, FormData>(
    action,
    {},
  );

  function update<K extends keyof ProductFormValues>(
    key: K,
    value: ProductFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  /*
    Gera o slug a partir do nome enquanto o campo nao for editado a mao.
    Feito no handler (e nao em useEffect) para evitar render em cascata.
  */
  function handleNameChange(name: string) {
    setValues((prev) => ({
      ...prev,
      name,
      slug: slugTouched ? prev.slug : slugify(name),
    }));
  }

  /** Casa o nome da loja vindo da importacao com uma loja cadastrada. */
  function matchStore(storeName: unknown): string | undefined {
    if (!storeName) return undefined;
    const target = String(storeName).toLowerCase();
    return stores.find((store) => store.name.toLowerCase() === target)?.id;
  }

  /**
   * Importa metadados publicos do link e PREENCHE o formulario.
   * Nada e salvo aqui - o admin revisa antes de publicar.
   */
  async function handleImportLink() {
    const url = importUrl.trim();
    if (!url) return;

    setImporting(true);
    setImportMessage(null);

    try {
      const response = await fetch("/api/admin/product-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const result = await response.json();

      if (!response.ok) {
        setImportMessage({
          text: result.error ?? "Falha ao importar.",
          tone: "error",
        });
        return;
      }

      const data = result.data ?? {};

      setValues((prev) => ({
        ...prev,
        name: data.name ?? prev.name,
        slug: prev.slug || slugify(data.name ?? ""),
        description: data.description ?? prev.description,
        imageUrl: data.imageUrl ?? prev.imageUrl,
        originalUrl: url,
        affiliateUrl: prev.affiliateUrl || url,
        currentPrice:
          data.currentPrice !== undefined
            ? String(data.currentPrice)
            : prev.currentPrice,
        originalPrice:
          data.originalPrice !== undefined
            ? String(data.originalPrice)
            : prev.originalPrice,
        storeId: matchStore(data.storeName) ?? prev.storeId,
      }));

      setImportMessage({
        text: result.message,
        tone: result.partial ? "warn" : "ok",
      });
    } catch {
      setImportMessage({
        text: "Não foi possível importar. Complete os campos manualmente.",
        tone: "error",
      });
    } finally {
      setImporting(false);
    }
  }

  /**
   * Extrai os dados do texto colado (mensagem de Telegram/WhatsApp).
   *
   * Mais confiavel que o link quando ele e encurtado de afiliado
   * (meli.la, amzn.to), que costuma redirecionar para fora da pagina
   * do produto - onde nao ha preco.
   */
  async function handleImportMessage() {
    const text = messageText.trim();
    if (!text) return;

    setImporting(true);
    setImportMessage(null);

    try {
      const response = await fetch("/api/admin/message-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const result = await response.json();

      if (!response.ok) {
        setImportMessage({
          text: result.error ?? "Falha ao interpretar o texto.",
          tone: "error",
        });
        return;
      }

      const data = result.data ?? {};

      setValues((prev) => ({
        ...prev,
        name: data.name ?? prev.name,
        slug: prev.slug || slugify(data.name ?? ""),
        description: data.description ?? prev.description,
        imageUrl: data.imageUrl ?? prev.imageUrl,
        affiliateUrl: data.affiliateUrl ?? prev.affiliateUrl,
        originalUrl: data.affiliateUrl ?? prev.originalUrl,
        currentPrice:
          data.currentPrice !== undefined
            ? String(data.currentPrice)
            : prev.currentPrice,
        originalPrice:
          data.originalPrice !== undefined
            ? String(data.originalPrice)
            : prev.originalPrice,
        discountPercentage:
          data.discountPercentage !== undefined
            ? String(data.discountPercentage)
            : prev.discountPercentage,
        couponCode: data.couponCode ?? prev.couponCode,
        storeId: matchStore(data.storeName) ?? prev.storeId,
      }));

      setImportMessage({
        text: result.message,
        tone: result.partial ? "warn" : "ok",
      });
    } catch {
      setImportMessage({
        text: "Não foi possível interpretar o texto. Preencha manualmente.",
        tone: "error",
      });
    } finally {
      setImporting(false);
    }
  }

  const previewProduct = useMemo(
    () => ({
      name: values.name || "Nome do produto",
      imageUrl: values.imageUrl,
      description: values.description,
      originalPrice: values.originalPrice,
      currentPrice: values.currentPrice,
      discountPercentage: values.discountPercentage,
      couponCode: values.couponCode,
      storeName:
        stores.find((store) => store.id === values.storeId)?.name ?? null,
      isFeatured: values.isFeatured,
      isFlashDeal: values.isFlashDeal,
    }),
    [values, stores],
  );

  const fieldError = (name: string) => state.fieldErrors?.[name];

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
      <div>
        {/* Importacao por link */}
        {mode === "create" && (
          <section className="mb-6 rounded-2xl border border-brand-200 bg-brand-50 p-5">
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-ink-900">
              Cadastro inteligente
            </h2>

            {/* Abas */}
            <div
              role="tablist"
              aria-label="Forma de importação"
              className="mt-3 flex gap-1 rounded-xl bg-white p-1"
            >
              <button
                type="button"
                role="tab"
                aria-selected={importMode === "message"}
                onClick={() => {
                  setImportMode("message");
                  setImportMessage(null);
                }}
                className={cn(
                  "flex-1 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wide transition-colors",
                  importMode === "message"
                    ? "bg-brand-600 text-white"
                    : "text-ink-500 hover:bg-slate-100",
                )}
              >
                Colar mensagem
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={importMode === "link"}
                onClick={() => {
                  setImportMode("link");
                  setImportMessage(null);
                }}
                className={cn(
                  "flex-1 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wide transition-colors",
                  importMode === "link"
                    ? "bg-brand-600 text-white"
                    : "text-ink-500 hover:bg-slate-100",
                )}
              >
                Importar por link
              </button>
            </div>

            {importMode === "message" ? (
              <div className="mt-4">
                <label
                  htmlFor="import-message"
                  className="text-xs text-ink-500"
                >
                  Cole a mensagem completa da oferta (Telegram, WhatsApp...).
                  Extraímos nome, preços, desconto, cupom e o link de afiliado.
                </label>
                <textarea
                  id="import-message"
                  rows={8}
                  value={messageText}
                  onChange={(event) => setMessageText(event.target.value)}
                  placeholder={`Placa De Vídeo Msi Geforce Rtx 5060 8gb\n\n💀 R$ 2.469,05\n🏆 R$ 2.279,00 ⚡ (-33% OFF)\n🎫 PROMOCERTAML\n👉 https://...`}
                  className={cn(inputClass, "mt-2 font-mono text-xs leading-relaxed")}
                />
                <button
                  type="button"
                  onClick={handleImportMessage}
                  disabled={importing || !messageText.trim()}
                  className="mt-2 w-full rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {importing ? "Extraindo..." : "Extrair da mensagem"}
                </button>
              </div>
            ) : (
              <div className="mt-4">
                <label htmlFor="import-url" className="text-xs text-ink-500">
                  Cole o link do produto na loja. Buscamos as informações
                  públicas disponíveis na página.
                </label>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <input
                    id="import-url"
                    type="url"
                    value={importUrl}
                    onChange={(event) => setImportUrl(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleImportLink();
                      }
                    }}
                    placeholder="Cole o link do produto"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={handleImportLink}
                    disabled={importing || !importUrl.trim()}
                    className="shrink-0 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {importing ? "Importando..." : "Importar produto"}
                  </button>
                </div>
              </div>
            )}

            {importMessage && (
              <p
                role="status"
                className={`mt-3 rounded-xl px-3.5 py-2.5 text-sm ${
                  importMessage.tone === "ok"
                    ? "bg-green-50 text-green-800"
                    : importMessage.tone === "warn"
                      ? "bg-amber-50 text-amber-900"
                      : "bg-red-50 text-red-700"
                }`}
              >
                {importMessage.text}
              </p>
            )}

            <p className="mt-3 text-[11px] leading-relaxed text-ink-500">
              {importMode === "message"
                ? "Links encurtados de afiliado (meli.la, amzn.to) costumam não levar à página do produto — por isso o texto da mensagem é a fonte mais confiável de preço. Nada é salvo até você publicar."
                : "Algumas lojas bloqueiam leitura automática ou carregam o preço via JavaScript. Nesses casos, use a aba “Colar mensagem” ou preencha manualmente."}
            </p>
          </section>
        )}

        <form action={formAction} className="space-y-5">
          {values.id && <input type="hidden" name="id" value={values.id} />}

          {state.error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700"
            >
              {state.error}
            </p>
          )}

          <section className="rounded-2xl border border-slate-200/80 bg-white p-5">
            <h2 className="mb-4 text-sm font-extrabold uppercase tracking-wide text-ink-900">
              Informações principais
            </h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="name" className={labelClass}>
                  Nome do produto *
                </label>
                <input
                  id="name"
                  name="name"
                  required
                  value={values.name}
                  onChange={(event) => handleNameChange(event.target.value)}
                  className={inputClass}
                  placeholder="Ex.: Air Fryer Mondial 4L"
                />
                {fieldError("name") && (
                  <p className="mt-1 text-xs text-red-600">
                    {fieldError("name")}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="slug" className={labelClass}>
                  Slug (URL) *
                </label>
                <input
                  id="slug"
                  name="slug"
                  required
                  value={values.slug}
                  onChange={(event) => {
                    setSlugTouched(true);
                    update("slug", event.target.value);
                  }}
                  className={inputClass}
                  placeholder="air-fryer-mondial-4l"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  /produto/{values.slug || "..."}
                </p>
                {fieldError("slug") && (
                  <p className="mt-1 text-xs text-red-600">
                    {fieldError("slug")}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="description" className={labelClass}>
                  Descrição curta
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={values.description}
                  onChange={(event) => update("description", event.target.value)}
                  className={inputClass}
                  placeholder="Um resumo curto que aparece no card."
                />
              </div>

              <div>
                <label htmlFor="imageUrl" className={labelClass}>
                  URL da imagem
                </label>
                <input
                  id="imageUrl"
                  name="imageUrl"
                  type="url"
                  value={values.imageUrl}
                  onChange={(event) => update("imageUrl", event.target.value)}
                  className={inputClass}
                  placeholder="https://..."
                />
                {fieldError("imageUrl") && (
                  <p className="mt-1 text-xs text-red-600">
                    {fieldError("imageUrl")}
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white p-5">
            <h2 className="mb-4 text-sm font-extrabold uppercase tracking-wide text-ink-900">
              Links
            </h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="affiliateUrl" className={labelClass}>
                  Link de afiliado * (destino do botão VER OFERTA)
                </label>
                <input
                  id="affiliateUrl"
                  name="affiliateUrl"
                  type="url"
                  required
                  value={values.affiliateUrl}
                  onChange={(event) =>
                    update("affiliateUrl", event.target.value)
                  }
                  className={inputClass}
                  placeholder="https://... (seu link de afiliado)"
                />
                {fieldError("affiliateUrl") && (
                  <p className="mt-1 text-xs text-red-600">
                    {fieldError("affiliateUrl")}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="originalUrl" className={labelClass}>
                  Link original (referência)
                </label>
                <input
                  id="originalUrl"
                  name="originalUrl"
                  type="url"
                  value={values.originalUrl}
                  onChange={(event) => update("originalUrl", event.target.value)}
                  className={inputClass}
                  placeholder="https://... (link usado na importação)"
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white p-5">
            <h2 className="mb-4 text-sm font-extrabold uppercase tracking-wide text-ink-900">
              Preços
            </h2>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="originalPrice" className={labelClass}>
                  Preço antigo (R$)
                </label>
                <input
                  id="originalPrice"
                  name="originalPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={values.originalPrice}
                  onChange={(event) =>
                    update("originalPrice", event.target.value)
                  }
                  className={inputClass}
                  placeholder="399.90"
                />
              </div>

              <div>
                <label htmlFor="currentPrice" className={labelClass}>
                  Preço atual (R$)
                </label>
                <input
                  id="currentPrice"
                  name="currentPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={values.currentPrice}
                  onChange={(event) =>
                    update("currentPrice", event.target.value)
                  }
                  className={inputClass}
                  placeholder="249.90"
                />
              </div>

              <div>
                <label htmlFor="discountPercentage" className={labelClass}>
                  Desconto (%)
                </label>
                <input
                  id="discountPercentage"
                  name="discountPercentage"
                  type="number"
                  min="0"
                  max="99"
                  value={values.discountPercentage}
                  onChange={(event) =>
                    update("discountPercentage", event.target.value)
                  }
                  className={inputClass}
                  placeholder="auto"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  {values.originalPrice && values.currentPrice
                    ? "Calculado pelos preços acima — este campo é ignorado."
                    : "Só usado quando não há preço antigo para comparar."}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="couponCode" className={labelClass}>
                Cupom (opcional)
              </label>
              <input
                id="couponCode"
                name="couponCode"
                value={values.couponCode}
                onChange={(event) => update("couponCode", event.target.value)}
                className={inputClass}
                placeholder="PROMO20"
              />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white p-5">
            <h2 className="mb-4 text-sm font-extrabold uppercase tracking-wide text-ink-900">
              Organização
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="categoryId" className={labelClass}>
                  Categoria
                </label>
                <select
                  id="categoryId"
                  name="categoryId"
                  value={values.categoryId}
                  onChange={(event) => update("categoryId", event.target.value)}
                  className={inputClass}
                >
                  <option value="">Sem categoria</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="storeId" className={labelClass}>
                  Loja
                </label>
                <select
                  id="storeId"
                  name="storeId"
                  value={values.storeId}
                  onChange={(event) => update("storeId", event.target.value)}
                  className={inputClass}
                >
                  <option value="">Sem loja</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="priority" className={labelClass}>
                  Prioridade
                </label>
                <input
                  id="priority"
                  name="priority"
                  type="number"
                  min="0"
                  max="9999"
                  value={values.priority}
                  onChange={(event) => update("priority", event.target.value)}
                  className={inputClass}
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Maior número aparece primeiro.
                </p>
              </div>

              <div>
                <label htmlFor="expiresAt" className={labelClass}>
                  Expira em (ofertas relâmpago)
                </label>
                <input
                  id="expiresAt"
                  name="expiresAt"
                  type="datetime-local"
                  value={values.expiresAt}
                  onChange={(event) => update("expiresAt", event.target.value)}
                  className={inputClass}
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Após esta data a oferta sai do ar automaticamente.
                </p>
              </div>
            </div>

            <fieldset className="mt-5">
              <legend className="mb-2 text-xs font-semibold text-ink-700">
                Destaques
              </legend>
              <div className="flex flex-col gap-2.5">
                <label className="flex items-center gap-2.5 text-sm text-ink-900">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={values.isActive}
                    onChange={(event) =>
                      update("isActive", event.target.checked)
                    }
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  Produto ativo (visível no site)
                </label>

                <label className="flex items-center gap-2.5 text-sm text-ink-900">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    checked={values.isFeatured}
                    onChange={(event) =>
                      update("isFeatured", event.target.checked)
                    }
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  Destacar na home
                </label>

                <label className="flex items-center gap-2.5 text-sm text-ink-900">
                  <input
                    type="checkbox"
                    name="isFlashDeal"
                    checked={values.isFlashDeal}
                    onChange={(event) =>
                      update("isFlashDeal", event.target.checked)
                    }
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  Oferta relâmpago
                </label>
              </div>
            </fieldset>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SubmitButton mode={mode} />
            <Link
              href="/admin/products"
              className="text-center text-sm font-semibold text-ink-500 hover:text-ink-900 sm:text-left"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>

      {/* Previa */}
      <aside className="xl:sticky xl:top-6 xl:self-start">
        <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-ink-900">
          Prévia
        </h2>
        <p className="mb-3 text-xs text-ink-500">
          É assim que o produto aparece no site.
        </p>
        <ProductPreview product={previewProduct} />
      </aside>
    </div>
  );
}
