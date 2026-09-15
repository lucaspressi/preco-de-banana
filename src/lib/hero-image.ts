import "server-only";

import fs from "node:fs";
import path from "node:path";

export interface HeroImage {
  src: string;
  /** Nenhuma imagem real disponivel - exibindo espaco reservado. */
  isPlaceholder: boolean;
  /**
   * true quando a arte ja e um selo/logo fechado (circulo, icones e nome
   * da marca embutidos). Nesse caso a hero NAO desenha o circulo azul,
   * o anel nem os icones flutuantes - eles ficariam duplicados.
   */
  isSelfContained: boolean;
}

/**
 * Resolve a imagem do mascote na hero.
 *
 * Basta colocar o arquivo em public/ que ele passa a ser usado, sem mexer
 * em codigo. Dois formatos sao suportados:
 *
 *   public/mascote.png        -> selo/logo completo (arte fechada)
 *   public/mascote-recorte.png -> recorte so da pessoa, fundo transparente
 *
 * O recorte tem prioridade: com ele a hero exibe os elementos graficos ao
 * redor, como na referencia visual original.
 */
const CUTOUT_CANDIDATES = [
  "mascote-recorte.png",
  "mascote-recorte.webp",
  "mascote-cutout.png",
];

const BADGE_CANDIDATES = [
  "mascote.png",
  "mascote.webp",
  "mascote.jpg",
  "mascote.jpeg",
  "mascote.avif",
];

const PLACEHOLDER = "/mascote-placeholder.svg";

let cached: HeroImage | null = null;

function findFirst(candidates: string[], publicDir: string): string | null {
  for (const candidate of candidates) {
    try {
      if (fs.existsSync(path.join(publicDir, candidate))) return candidate;
    } catch {
      // Ambiente sem acesso ao filesystem - ignora.
    }
  }
  return null;
}

export function getHeroImage(): HeroImage {
  if (cached && process.env.NODE_ENV === "production") return cached;

  const publicDir = path.join(process.cwd(), "public");

  const cutout = findFirst(CUTOUT_CANDIDATES, publicDir);
  if (cutout) {
    cached = {
      src: `/${cutout}`,
      isPlaceholder: false,
      isSelfContained: false,
    };
    return cached;
  }

  const badge = findFirst(BADGE_CANDIDATES, publicDir);
  if (badge) {
    cached = {
      src: `/${badge}`,
      isPlaceholder: false,
      isSelfContained: true,
    };
    return cached;
  }

  cached = {
    src: PLACEHOLDER,
    isPlaceholder: true,
    isSelfContained: false,
  };
  return cached;
}
