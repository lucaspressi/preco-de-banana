-- AlterTable
ALTER TABLE "site_settings" ALTER COLUMN "siteDescription" SET DEFAULT 'Promocoes, cupons e produtos selecionados para voce pagar preco de banana.',
ALTER COLUMN "heroTitle" SET DEFAULT 'PREÇO DE BANANA',
ALTER COLUMN "heroSubtitle" SET DEFAULT 'As melhores promocoes da internet, todos os dias!';

-- CreateTable
CREATE TABLE "login_tokens" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "login_tokens_email_expiresAt_idx" ON "login_tokens"("email", "expiresAt");
