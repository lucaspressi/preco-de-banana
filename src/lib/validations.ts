import { z } from "zod";

/** Aceita apenas http/https - bloqueia javascript:, data:, file: etc. */
export const safeUrl = z
  .string()
  .trim()
  .min(1, "URL obrigatoria")
  .refine((value) => {
    try {
      const parsed = new URL(value);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }, "Informe uma URL valida (http ou https)");

export const optionalSafeUrl = z
  .union([safeUrl, z.literal("")])
  .optional()
  .transform((v) => (v === "" ? undefined : v));

const emptyToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(
    (v) => (v === "" || v === null ? undefined : v),
    schema.optional(),
  );

/** Preco em BRL. Aceita "1.234,56" e "1234.56". */
export const priceSchema = emptyToUndefined(
  z.coerce
    .number()
    .nonnegative("Preco nao pode ser negativo")
    .max(9_999_999, "Preco acima do limite suportado"),
);

export const slugSchema = z
  .string()
  .trim()
  .min(1, "Slug obrigatorio")
  .max(120)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use apenas letras minusculas, numeros e hifens",
  );

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail invalido"),
  password: z.string().min(1, "Senha obrigatoria").max(200),
});

export const productSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(200),
  slug: slugSchema,
  description: emptyToUndefined(z.string().trim().max(2000)),
  imageUrl: optionalSafeUrl,
  affiliateUrl: safeUrl,
  originalUrl: optionalSafeUrl,
  originalPrice: priceSchema,
  currentPrice: priceSchema,
  discountPercentage: emptyToUndefined(
    z.coerce.number().int().min(0).max(99),
  ),
  couponCode: emptyToUndefined(z.string().trim().max(60)),
  categoryId: emptyToUndefined(z.string().trim()),
  storeId: emptyToUndefined(z.string().trim()),
  isFeatured: z.coerce.boolean().default(false),
  isFlashDeal: z.coerce.boolean().default(false),
  isActive: z.coerce.boolean().default(true),
  priority: z.coerce.number().int().min(0).max(9999).default(0),
  expiresAt: emptyToUndefined(z.coerce.date()),
});

export type ProductInput = z.infer<typeof productSchema>;

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: slugSchema,
  description: emptyToUndefined(z.string().trim().max(500)),
  icon: emptyToUndefined(z.string().trim().max(60)),
  imageUrl: optionalSafeUrl,
  isActive: z.coerce.boolean().default(true),
  priority: z.coerce.number().int().min(0).max(9999).default(0),
});

export const storeSchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: slugSchema,
  logoUrl: optionalSafeUrl,
  url: optionalSafeUrl,
  isActive: z.coerce.boolean().default(true),
  priority: z.coerce.number().int().min(0).max(9999).default(0),
});

export const couponSchema = z.object({
  title: z.string().trim().min(2).max(160),
  code: z.string().trim().min(1).max(60),
  description: emptyToUndefined(z.string().trim().max(500)),
  discount: emptyToUndefined(z.string().trim().max(60)),
  affiliateUrl: optionalSafeUrl,
  storeId: emptyToUndefined(z.string().trim()),
  expiresAt: emptyToUndefined(z.coerce.date()),
  isActive: z.coerce.boolean().default(true),
  priority: z.coerce.number().int().min(0).max(9999).default(0),
});

export const testimonialSchema = z.object({
  authorName: z.string().trim().min(2).max(120),
  content: z.string().trim().min(5).max(1000),
  rating: emptyToUndefined(z.coerce.number().int().min(1).max(5)),
  avatarUrl: optionalSafeUrl,
  isActive: z.coerce.boolean().default(true),
  priority: z.coerce.number().int().min(0).max(9999).default(0),
});

export const siteSettingsSchema = z.object({
  siteName: z.string().trim().min(1).max(120),
  siteDescription: z.string().trim().max(400),
  telegramUrl: optionalSafeUrl,
  instagramUrl: optionalSafeUrl,
  youtubeUrl: optionalSafeUrl,
  contactEmail: emptyToUndefined(z.string().trim().email("E-mail invalido")),
  heroTitle: z.string().trim().min(1).max(160),
  heroSubtitle: z.string().trim().max(400),
});

export const productImportSchema = z.object({
  url: safeUrl,
});

export const messageImportSchema = z.object({
  text: z
    .string()
    .trim()
    .min(5, "Cole a mensagem completa")
    .max(5000, "Texto muito longo"),
});
