import { useFinanceStore } from '@/hooks/use-finance-store';

/**
 * Formats a numeric value into the user's default currency representation.
 * @param val The numeric amount to format.
 * @param customCurrency Optional override currency code.
 * @returns A formatted string (e.g., "₱1,234.56" or "$1,234.56").
 */
export const formatCurrency = (val: number, customCurrency?: string): string => {
  let userCurrency = customCurrency;
  if (!userCurrency) {
    try {
      userCurrency = useFinanceStore.getState().user?.currency;
    } catch {
      // Fallback if store is not initialized or running in server component
    }
  }
  userCurrency = userCurrency || 'PHP';

  let locale = 'en-PH';
  if (userCurrency === 'USD') locale = 'en-US';
  else if (userCurrency === 'EUR') locale = 'de-DE';
  else if (userCurrency === 'GBP') locale = 'en-GB';
  else if (userCurrency === 'JPY') locale = 'ja-JP';
  else if (userCurrency === 'AUD') locale = 'en-AU';
  else if (userCurrency === 'CAD') locale = 'en-CA';
  else if (userCurrency === 'SGD') locale = 'en-SG';

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: userCurrency
    }).format(val);
  } catch (e) {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(val);
  }
};

/**
 * Gets the currency symbol representing a given currency code.
 * @param customCurrency Optional override currency code.
 * @returns The symbol (e.g., "₱" or "$").
 */
export const getCurrencySymbol = (customCurrency?: string): string => {
  let userCurrency = customCurrency;
  if (!userCurrency) {
    try {
      userCurrency = useFinanceStore.getState().user?.currency;
    } catch {}
  }
  userCurrency = userCurrency || 'PHP';

  let locale = 'en-PH';
  if (userCurrency === 'USD') locale = 'en-US';
  else if (userCurrency === 'EUR') locale = 'de-DE';
  else if (userCurrency === 'GBP') locale = 'en-GB';
  else if (userCurrency === 'JPY') locale = 'ja-JP';
  else if (userCurrency === 'AUD') locale = 'en-AU';
  else if (userCurrency === 'CAD') locale = 'en-CA';
  else if (userCurrency === 'SGD') locale = 'en-SG';

  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: userCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    return formatter.format(0).replace(/\d/g, '').trim();
  } catch (e) {
    return '₱';
  }
};


/**
 * Parses a transaction description to extract metadata like fees and transfer reference IDs.
 * @param description The raw description text.
 * @returns An object with the clean description, fee, and transfer reference ID.
 */
export function parseDescription(description: string) {
  if (!description) return { cleanDesc: '', fee: 0, refId: null };
  
  // Extract fee
  const feeMatch = description.match(/\[Fee:\s*([\d.]+)\]/);
  const fee = feeMatch ? parseFloat(feeMatch[1]) : 0;
  
  // Extract transfer ref
  const refMatch = description.match(/\(Ref:\s*(tx-tr-\d+)\)/);
  const refId = refMatch ? refMatch[1] : null;
  
  // Clean description (remove metadata tags)
  const cleanDesc = description
    .replace(/\[Fee:\s*[\d.]+\]/, '')
    .replace(/\(Ref:\s*tx-tr-\d+\)/, '')
    .trim();
  
  return { cleanDesc, fee, refId };
}
