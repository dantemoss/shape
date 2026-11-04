const TOKEN = process.env.NEXT_PUBLIC_LOGODEV_TOKEN?.trim() ?? "";

export function logoUrl(domain: string, size = 64): string | null {
  if (!domain || !TOKEN) return null;
  return `https://img.logo.dev/${encodeURIComponent(domain)}?token=${encodeURIComponent(TOKEN)}&size=${size}&format=webp`;
}

export const NETWORK_DOMAINS: Record<string, string> = {
  visa:       "visa.com",
  mastercard: "mastercard.com",
  amex:       "americanexpress.com",
};
