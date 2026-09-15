import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Painel", template: "%s | Painel" },
  robots: { index: false, follow: false, nocache: true },
};

/**
 * O layout do admin apenas define metadata.
 * A sidebar fica em (dashboard)/layout.tsx para nao envolver /admin/login.
 */
export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
