import "dotenv/config";

import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";

/**
 * Seed de producao.
 *
 * Cria: usuario admin, categorias padrao, lojas padrao e as configuracoes
 * do site. NAO cria produtos, cupons ou depoimentos ficticios.
 *
 * A senha do admin vem de ADMIN_PASSWORD e e gravada apenas como hash bcrypt.
 * Depois do primeiro deploy, ADMIN_PASSWORD pode ser removida do ambiente.
 */

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL nao definida.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const CATEGORIES = [
  {
    name: "Eletrônicos",
    slug: "eletronicos",
    description: "Tecnologia, celulares, notebooks e mais",
    icon: "smartphone",
    priority: 80,
  },
  {
    name: "Casa Inteligente",
    slug: "casa-inteligente",
    description: "Automação, dispositivos e assistentes",
    icon: "lightbulb",
    priority: 70,
  },
  {
    name: "Beleza e Saúde",
    slug: "beleza-e-saude",
    description: "Cuide-se com os melhores produtos",
    icon: "sparkles",
    priority: 60,
  },
  {
    name: "Moda e Acessórios",
    slug: "moda-e-acessorios",
    description: "Roupas, tênis, bolsas e acessórios",
    icon: "shirt",
    priority: 50,
  },
  {
    name: "Cozinha e Eletrodomésticos",
    slug: "cozinha-e-eletrodomesticos",
    description: "Praticidade para o seu dia a dia",
    icon: "chef-hat",
    priority: 40,
  },
  {
    name: "Esportes e Fitness",
    slug: "esportes-e-fitness",
    description: "Suplementos, acessórios e equipamentos",
    icon: "dumbbell",
    priority: 30,
  },
  {
    name: "Games",
    slug: "games",
    description: "Consoles, jogos e acessórios",
    icon: "gamepad",
    priority: 20,
  },
  {
    name: "Móveis e Decoração",
    slug: "moveis-e-decoracao",
    description: "Transforme seu espaço gastando pouco",
    icon: "sofa",
    priority: 10,
  },
];

const STORES = [
  { name: "Amazon", slug: "amazon", url: "https://www.amazon.com.br", priority: 60 },
  {
    name: "Mercado Livre",
    slug: "mercado-livre",
    url: "https://www.mercadolivre.com.br",
    priority: 50,
  },
  {
    name: "Magalu",
    slug: "magalu",
    url: "https://www.magazineluiza.com.br",
    priority: 40,
  },
  { name: "Shopee", slug: "shopee", url: "https://shopee.com.br", priority: 30 },
  {
    name: "AliExpress",
    slug: "aliexpress",
    url: "https://pt.aliexpress.com",
    priority: 20,
  },
  { name: "KaBuM", slug: "kabum", url: "https://www.kabum.com.br", priority: 10 },
];

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn(
      "⚠  ADMIN_EMAIL/ADMIN_PASSWORD ausentes - usuario admin nao criado.",
    );
    return;
  }

  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD precisa ter ao menos 8 caracteres.");
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log(`✓ Admin ja existe: ${email} (senha preservada)`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: { email, passwordHash, name: "Administrador" },
  });

  console.log(`✓ Admin criado: ${email}`);
}

async function seedCategories() {
  for (const category of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }
  console.log(`✓ ${CATEGORIES.length} categorias`);
}

async function seedStores() {
  for (const store of STORES) {
    await prisma.store.upsert({
      where: { slug: store.slug },
      update: {},
      create: store,
    });
  }
  console.log(`✓ ${STORES.length} lojas`);
}

async function seedSettings() {
  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      siteName: "Preço de Banana",
      siteDescription:
        "Promoções, cupons e produtos selecionados para você pagar preço de banana.",
      telegramUrl: "",
      heroTitle: "PREÇO DE BANANA",
      heroSubtitle:
        "As melhores promoções da internet, todos os dias!",
    },
  });
  console.log("✓ Configuracoes do site");
}

async function main() {
  console.log("\nSeed - Preço de Banana\n");
  await seedAdmin();
  await seedCategories();
  await seedStores();
  await seedSettings();
  console.log("\nConcluido.\n");
}

main()
  .catch((error) => {
    console.error("\n✗ Falha no seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
