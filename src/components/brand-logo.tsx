import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  /** Em fundo escuro, aplica um leve realce para nao sumir. */
  inverted?: boolean;
  href?: string;
  /** Altura em px. O logo e horizontal (proporcao ~3:1). */
  height?: number;
}

/**
 * Logotipo da marca (mascote + "PRECO DE BANANA").
 *
 * Usa a arte oficial em public/logo.webp. Se o arquivo for trocado, basta
 * manter o nome - nenhum codigo precisa mudar.
 */
export function BrandLogo({
  className,
  inverted = false,
  href = "/",
  height = 44,
}: BrandLogoProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex shrink-0 items-center transition-transform hover:scale-[1.03]",
        className,
      )}
      aria-label="Preço de Banana - página inicial"
    >
      <Image
        src="/logo.webp"
        alt="Preço de Banana"
        width={640}
        height={213}
        priority
        style={{ height, width: "auto" }}
        className={cn(
          "w-auto object-contain",
          inverted && "drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]",
        )}
      />
    </Link>
  );
}
