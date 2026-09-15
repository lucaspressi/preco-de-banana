import "dotenv/config";

import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";

/**
 * Redefine a senha de um usuario do painel (ou cria o usuario).
 *
 * Uso:
 *   npx tsx scripts/reset-admin-password.ts <email> <nova-senha>
 *
 * Existe porque o seed e conservador de proposito: se o usuario ja existe,
 * ele preserva a senha atual - assim rodar o seed de novo nunca sobrescreve
 * uma senha que voce ja trocou.
 */

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("✗ DATABASE_URL nao definida.");
  process.exit(1);
}

const [emailArg, passwordArg] = process.argv.slice(2);

if (!emailArg || !passwordArg) {
  console.error("Uso: npx tsx scripts/reset-admin-password.ts <email> <nova-senha>");
  process.exit(1);
}

const email = emailArg.toLowerCase().trim();
const password = passwordArg;

if (password.length < 8) {
  console.error("✗ A senha precisa ter ao menos 8 caracteres.");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const passwordHash = await bcrypt.hash(password, 12);

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.user.update({ where: { email }, data: { passwordHash } });
    console.log(`✓ Senha redefinida para: ${email}`);
  } else {
    await prisma.user.create({
      data: { email, passwordHash, name: "Administrador" },
    });
    console.log(`✓ Usuario criado: ${email}`);
  }

  console.log("\nEntre em /admin/login com essas credenciais.");
  console.log(
    "Depois, remova ADMIN_PASSWORD das variaveis de ambiente do servico.\n",
  );

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("\n✗ Falha ao redefinir a senha:", error);
  await prisma.$disconnect();
  process.exit(1);
});
