export const estimateWateringDays = (text = "") => {
  const t = text.toLowerCase();
  if (t.includes("daily") || t.includes("diario")) return 1;
  if (t.includes("twice") || t.includes("2-3")) return 2;
  if (t.includes("week")) return 7;
  if (t.includes("two week") || t.includes("14")) return 14;
  if (t.includes("month")) return 30;
  return 7;
};