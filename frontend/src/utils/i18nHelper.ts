export interface LocalizedProduct {
  sku?: string;
  name?: string;
  nameKo?: string;
  nameEn?: string;
  name_ko?: string;
  name_en?: string;
  [key: string]: any;
}

export interface LocalizedSupplier {
  supplierName?: string;
  supplierNameKo?: string;
  supplierNameEn?: string;
  supplier_name?: string;
  supplier_name_ko?: string;
  supplier_name_en?: string;
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
      product.name ||
      product.nameEn ||
      product.name_en ||
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
 * Returns localized supplier / fleet name based on current language ('ko' vs 'en').
 * English default: supplierName / supplier_name
 * Korean: supplierNameKo / supplier_name_ko
 */
export function getLocalizedSupplierName(
  item?: LocalizedSupplier | null,
  lang?: string
): string {
  if (!item) return '';
  const isEn = !lang?.startsWith('ko');

  if (isEn) {
    return (
      item.supplierName ||
      item.supplier_name ||
      item.supplierNameEn ||
      item.supplier_name_en ||
      item.supplierNameKo ||
      item.supplier_name_ko ||
      ''
    );
  }

  return (
    item.supplierNameKo ||
    item.supplier_name_ko ||
    item.supplierName ||
    item.supplier_name ||
    item.supplierNameEn ||
    item.supplier_name_en ||
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

/*
 * TODO: fleets DB에 home_port_ko 추가 및 home_port 영문화 후 이 매핑 제거
 */
const PORT_EN_MAP: Record<string, string> = {
  '부산항 감천항만': 'Gamcheon Port, Busan',
  '인천항 제3부두': 'Pier 3, Incheon Port',
  '포항 구룡포항': 'Guryongpo Port, Pohang',
  '미지정 부두': 'Unassigned Pier',
};

export function getLocalizedPort(port?: string, lang?: string): string {
  if (!port) return '';
  const isEn = !lang?.startsWith('ko');
  if (isEn && PORT_EN_MAP[port]) {
    return PORT_EN_MAP[port];
  }
  return port;
}

