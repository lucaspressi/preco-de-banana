import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "jpm_session";

/**
 * Protege /admin e /api/admin.
 *
 * Primeira barreira: valida a assinatura do JWT no edge, antes de qualquer
 * render. Cada rota/handler revalida a sessao no servidor - o proxy
 * sozinho nunca e tratado como a unica protecao.
 */
async function isValidSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;

  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) return false;

  try {
    await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ["HS256"],
    });
    return true;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const isLoginPage = pathname === "/admin/login";
  const isLoginApi = pathname === "/api/admin/login";
  const isProtected =
    (pathname.startsWith("/admin") && !isLoginPage) ||
    (pathname.startsWith("/api/admin") && !isLoginApi);

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const authenticated = await isValidSession(token);

  if (isProtected && !authenticated) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Não autenticado." },
        { status: 401 },
      );
    }

    const loginUrl = new URL("/admin/login", request.url);
    // Preserva o destino para redirecionar apos o login.
    if (pathname !== "/admin") {
      loginUrl.searchParams.set("next", `${pathname}${search}`);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Ja autenticado nao precisa ver a tela de login.
  if (isLoginPage && authenticated) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  const response = NextResponse.next();

  // Cabecalhos de seguranca aplicados a todo o site.
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  );

  // O painel nunca deve ser indexado nem cacheado.
  if (pathname.startsWith("/admin")) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    response.headers.set("Cache-Control", "no-store, max-age=0");
  }

  return response;
}

export const config = {
  matcher: [
    /*
      Aplica a todas as rotas, exceto assets estaticos e otimizacao de imagem.
    */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|txt|xml)$).*)",
  ],
};
