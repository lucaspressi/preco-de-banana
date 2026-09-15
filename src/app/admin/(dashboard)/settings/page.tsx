import { getSiteSettings } from "@/lib/settings";

import { SettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-2xl font-extrabold text-ink-900">
          Configurações
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Ajustes globais do site. Nenhuma alteração exige mexer no código.
        </p>
      </header>

      <SettingsForm settings={settings} />
    </div>
  );
}
