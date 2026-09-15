import "dotenv/config";

/**
 * Diagnostica o feed externo de promocoes.
 *
 * Uso:
 *   npx tsx scripts/check-promo-feed.ts
 *   npx tsx scripts/check-promo-feed.ts https://promo.anbu.pro/api/products
 *
 * Mostra os nomes reais dos campos retornados, para conferir se o
 * mapeamento em src/lib/promo-feed.ts esta correto.
 */

const base = (
  process.argv[2] ??
  process.env.PROMO_API_URL ??
  "https://promo.anbu.pro/api/products"
).replace(/\/+$/, "");

async function probe(path: string) {
  const url = `${base}${path}`;
  process.stdout.write(`\n${url}\n`);

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });

    const contentType = response.headers.get("content-type") ?? "";
    console.log(`  status: ${response.status} | tipo: ${contentType}`);

    if (!contentType.includes("json")) {
      console.log("  ✗ resposta nao e JSON (rota ainda nao publicada?)");
      return null;
    }

    const payload: unknown = await response.json();
    return payload;
  } catch (error) {
    console.log(
      `  ✗ falha: ${error instanceof Error ? error.message : String(error)}`,
    );
    return null;
  }
}

async function main() {
  console.log("=== Diagnostico do feed de promocoes ===");

  const list = await probe("/list?limit=2&sort=discount");

  if (list) {
    const items = Array.isArray(list)
      ? list
      : ((list as Record<string, unknown>).products as unknown[]) ??
        ((list as Record<string, unknown>).data as unknown[]) ??
        [];

    console.log(`  itens recebidos: ${items.length}`);

    const first = items[0];
    if (first && typeof first === "object") {
      console.log("\n  Campos do primeiro item:");
      for (const [key, value] of Object.entries(
        first as Record<string, unknown>,
      )) {
        const preview = JSON.stringify(value);
        console.log(
          `    ${key.padEnd(20)} ${preview.slice(0, 60)}${preview.length > 60 ? "..." : ""}`,
        );
      }
      console.log(
        "\n  Confira se esses nomes estao mapeados em src/lib/promo-feed.ts",
      );
    }
  }

  await probe("/categories");

  console.log();
}

main();
