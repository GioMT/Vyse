/**
 * Formats a numeric value into USD currency representation.
 * @param val The numeric amount to format.
 * @returns A formatted string (e.g., "$1,234.56").
 */
export const formatCurrency = (val: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(val);
};
