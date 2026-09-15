import "dotenv/config";

import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";

/**
 * Diagnostico de acesso ao painel.
 *
 * Uso (no Shell do Render ou local):
 *   npx tsx scripts/check-admin.ts
 *   npx tsx scripts/check-admin.ts "a-senha-que-estou-tentando"
 *
 * Nao imprime senhas nem hashes completos.
 */

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("✗ DATABASE_URL nao definida.");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

function mask(value: string | undefined): string {
  if (!value) return "(vazio)";
  if (value.length <= 2) return "*".repeat(value.length);
  return `${value[0]}${"*".repeat(Math.max(1, value.length - 2))}${value[value.length - 1]} (${value.length} chars)`;
}

async function main() {
  console.log("\n=== Diagnostico de login do painel ===\n");

  // 1. Banco acessivel?
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("✓ Conexao com o banco: OK");
  } catch (error) {
    console.error("✗ Nao consegui conectar ao banco.");
    console.error("  ", error instanceof Error ? error.message : error);
    process.exit(1);
  }

  // 2. AUTH_SECRET presente e valido?
  const secret = process.env.AUTH_SECRET ?? "";
  if (!secret) {
    console.log("✗ AUTH_SECRET: ausente — o login NAO funciona sem ela.");
  } else if (secret.length < 32) {
    console.log(
      `✗ AUTH_SECRET: muito curta (${secret.length} chars, minimo 32) — o login falha.`,
    );
  } else {
    console.log(`✓ AUTH_SECRET: definida (${secret.length} chars)`);
  }

  // 3. Existe algum usuario?
  const users = await prisma.user.findMany({
    select: { email: true, passwordHash: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  console.log(`\nUsuarios cadastrados: ${users.length}`);

  if (users.length === 0) {
    console.log("\n✗ CAUSA PROVAVEL: nenhum usuario no banco.");
    console.log("  O seed ainda nao foi executado neste ambiente.");
    console.log("\n  Rode:  npm run db:seed");
    console.log(
      "  (exige ADMIN_EMAIL e ADMIN_PASSWORD definidas no ambiente)\n",
    );
    await prisma.$disconnect();
    return;
  }

  for (const user of users) {
    console.log(`  - "${user.email}"  criado em ${user.createdAt.toISOString()}`);
    if (!user.passwordHash.startsWith("$2")) {
      console.log("    ✗ hash nao parece bcrypt — usuario invalido.");
    }
  }

  // 4. O ADMIN_EMAIL do ambiente bate com algum usuario?
  const envEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  console.log(`\nADMIN_EMAIL no ambiente: ${envEmail ? `"${envEmail}"` : "(nao definida)"}`);

  if (envEmail) {
    const match = users.find((u) => u.email === envEmail);
    if (match) {
      console.log("✓ Confere com um usuario cadastrado.");
    } else {
      console.log("✗ NAO confere com nenhum usuario cadastrado.");
      console.log("  Use exatamente um dos e-mails listados acima para entrar.");
    }
  }

  // 5. Teste opcional de senha
  const candidate = process.argv[2];
  if (candidate) {
    console.log(`\nTestando a senha informada (${mask(candidate)})...`);
    let matched = false;
    for (const user of users) {
      if (await bcrypt.compare(candidate, user.passwordHash)) {
        console.log(`✓ A senha confere para: "${user.email}"`);
        matched = true;
      }
    }
    if (!matched) {
      console.log("✗ A senha nao confere com nenhum usuario.");
      console.log("\n  Para redefinir:");
      console.log("    npx tsx scripts/reset-admin-password.ts <email> <nova-senha>");
    }
  } else {
    console.log(
      "\nDica: passe a senha como argumento para testa-la, ex.:",
    );
    console.log('  npx tsx scripts/check-admin.ts "minha-senha"');
  }

  console.log();
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("\n✗ Falha no diagnostico:", error);
  await prisma.$disconnect();
  process.exit(1);
});
