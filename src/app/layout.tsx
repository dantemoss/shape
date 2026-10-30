import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ShapeProvider } from "@/components/shape-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shape — Finanzas",
  description: "Tu gestor de finanzas personal",
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <ShapeProvider>{children}</ShapeProvider>
      </body>
    </html>
  );
}
