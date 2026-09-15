import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /*
      As imagens de produto vem das lojas parceiras, cujos dominios variam.
      Liberamos qualquer host HTTPS: as URLs sao cadastradas por um admin
      autenticado, e o otimizador do Next apenas processa a imagem - nao
      executa nada do conteudo remoto.
    */
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24,
  },

  poweredByHeader: false,

  // Falhar o build por erro de tipo e proposital:
  // evita subir para producao com problema conhecido.
  // (No Next 16 o lint e um passo separado - ver script "lint".)
  typescript: { ignoreBuildErrors: false },

  experimental: {
    optimizePackageImports: ["cheerio"],
  },
};

export default nextConfig;
