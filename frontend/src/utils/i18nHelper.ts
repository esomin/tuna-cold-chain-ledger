export interface LocalizedProduct {
  sku?: string;
  name?: string;
  nameKo?: string;
  nameEn?: string;
  name_ko?: string;
  name_en?: string;
  [key: string]: any;
}

/**
 * Returns localized product name based on current language ('ko' vs 'en').
 * Gracefully falls back across nameEn / name_en / nameKo / name_ko / name.
 */
export function getLocalizedProductName(
  product?: LocalizedProduct | null,
  lang?: string
): string {
  if (!product) return '';
  const isEn = !lang?.startsWith('ko');

  if (isEn) {
    return (
      product.nameEn ||
      product.name_en ||
      product.name ||
      product.nameKo ||
      product.name_ko ||
      ''
    );
  }

  return (
    product.nameKo ||
    product.name_ko ||
    product.name ||
    product.nameEn ||
    product.name_en ||
    ''
  );
}

/**
 * Generic localized attribute resolver for objects with _ko / _en / Ko / En properties.
 */
export function getLocalizedValue<T extends Record<string, any>>(
  item: T | null | undefined,
  field: string,
  lang?: string
): string {
  if (!item) return '';
  const isEn = !lang?.startsWith('ko');
  const enKey = `${field}En`;
  const snakeEnKey = `${field}_en`;
  const koKey = `${field}Ko`;
  const snakeKoKey = `${field}_ko`;

  if (isEn) {
    return item[enKey] || item[snakeEnKey] || item[field] || item[koKey] || item[snakeKoKey] || '';
  }
  return item[koKey] || item[snakeKoKey] || item[field] || item[enKey] || item[snakeEnKey] || '';
}
