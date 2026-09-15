import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";

/**
 * Redirect de afiliado com registro de clique.
 *
 * Fluxo: usuario clica em VER OFERTA -> /go/[productId] -> registra o clique
 * -> 307 para o affiliateUrl.
 *
 * O affiliateUrl nunca e exposto no HTML, o que permite trocar o link sem
 * invalidar paginas ja indexadas e viabiliza as metricas do painel.
 */
export const dynamic = "force-dynamic";

/** Trunca para nao guardar strings gigantes vindas do cliente. */
function truncate(value: string | null, max: number): string | null {
  if (!value) return null;
  const clean = value.trim();
  return clean ? clean.slice(0, max) : null;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ productId: string }> },
) {
  const { productId } = await context.params;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, affiliateUrl: true, isActive: true },
  });

  if (!product || !product.isActive) {
    return NextResponse.redirect(new URL("/ofertas", request.url), 307);
  }

  // Nao registramos IP - apenas referrer e user-agent, para metricas basicas.
  const referrer = truncate(request.headers.get("referer"), 500);
  const userAgent = truncate(request.headers.get("user-agent"), 300);

  // O clique nao pode atrasar nem impedir o redirect.
  try {
    await prisma.affiliateClick.create({
      data: { productId: product.id, referrer, userAgent },
    });
  } catch (error) {
    console.error("[go] falha ao registrar clique:", error);
  }

  return NextResponse.redirect(product.affiliateUrl, 307);
}
