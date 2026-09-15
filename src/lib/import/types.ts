/**
 * Contrato de importacao de produtos.
 *
 * Hoje existe um unico provider (scraping de metadados publicos).
 * Providers oficiais - Amazon PA-API, Mercado Livre, Shopee, Magalu -
 * podem ser adicionados implementando a mesma interface, sem alterar
 * o route handler nem o formulario do admin.
 */

export interface ImportedProductData {
  name?: string;
  description?: string;
  imageUrl?: string;
  originalPrice?: number;
  currentPrice?: number;
  storeName?: string;
  brand?: string;
  currency?: string;
  /** Campos efetivamente encontrados - alimenta o feedback no admin. */
  foundFields: string[];
}

export interface ImportResult {
  success: boolean;
  data: ImportedProductData;
  /** Mensagem amigavel exibida ao admin. */
  message: string;
  /** true quando a origem bloqueou ou exige JavaScript. */
  partial: boolean;
  sourceUrl: string;
}

export interface ProductImportProvider {
  readonly name: string;
  /** Indica se este provider sabe lidar com a URL informada. */
  supports(url: URL): boolean;
  fetchProduct(url: URL): Promise<ImportedProductData>;
}
