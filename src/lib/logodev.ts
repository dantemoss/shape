const TOKEN = process.env.NEXT_PUBLIC_LOGODEV_TOKEN ?? "pk_Aej5BOTfQO2QuDrf-E2S2w";

export function logoUrl(domain: string, size = 64): string {
  return `https://img.logo.dev/${domain}?token=${TOKEN}&size=${size}&format=webp`;
}

export const NETWORK_DOMAINS: Record<string, string> = {
  visa:       "visa.com",
  mastercard: "mastercard.com",
  amex:       "americanexpress.com",
};
