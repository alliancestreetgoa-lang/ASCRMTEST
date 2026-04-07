import { useRegion } from "@/contexts/RegionContext";

export function useCurrency() {
  const { region } = useRegion();
  const isAED = region === "UAE";
  const symbol = isAED ? "AED" : "£";

  const format = (amount: number) =>
    isAED ? `AED ${amount.toLocaleString()}` : `£${amount.toLocaleString()}`;

  const formatK = (amount: number) =>
    isAED ? `AED ${(amount / 1000).toFixed(0)}k` : `£${(amount / 1000).toFixed(0)}k`;

  const label = (base: string) => `${base} (${symbol})`;

  return { symbol, format, formatK, label, isAED };
}
