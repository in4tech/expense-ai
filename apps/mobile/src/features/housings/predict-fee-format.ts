/** Strip non-digits and parse fee text (supports "3.800" / "3800"). */
export const parseFeeDigits = (value: string): number | null => {
  const digits = value.replace(/\D/g, "");
  if (!digits) return null;
  const n = Number(digits);
  return Number.isFinite(n) ? n : null;
};

/** Format digits with Vietnamese thousand separators (e.g. 3800 → "3.800"). */
export const formatFeeDigits = (value: string): string => {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("vi-VN");
};
