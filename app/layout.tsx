import "./globals.css";
import type { Metadata } from "next";
import ScrollToTop from "./components/ScrollToTop";
import ParticleBackground from "./components/ParticleBackground";

export const metadata: Metadata = {
  title: {
    default: "Empresas Monarca",
    template: "%s | Empresas Monarca",
  },
  description:
    "Marketplace premium de productos, inmuebles y financiación en Argentina. Descubre tecnología, moda, hogar y más con crédito fácil y envío rápido.",
  keywords: [
    "Empresas Monarca",
    "marketplace",
    "compras online",
    "productos premium",
    "inmuebles",
    "crédito",
    "financiación",
    "ofertas",
    "Argentina",
    "Buenos Aires",
    "comprar en cuotas",
  ],
  authors: [{ name: "Empresas Monarca" }],
  creator: "Empresas Monarca",
  publisher: "Empresas Monarca",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "Empresas Monarca",
    title: "Empresas Monarca",
    description:
      "Marketplace de productos, inmuebles y financiación en Argentina. Descubre tecnología, moda, hogar y más con crédito fácil.",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://empresas-monarca.vercel.app",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Empresas Monarca",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Empresas Monarca",
    description:
      "Marketplace de productos, inmuebles y financiación en Argentina.",
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: [
      { url: "/logo.jpg", type: "image/jpeg", sizes: "32x32" },
      { url: "/logo.jpg", type: "image/jpeg", sizes: "96x96" },
    ],
    apple: [
      { url: "/logo.jpg", type: "image/jpeg" },
      { url: "/logo.jpg", type: "image/jpeg", sizes: "180x180" },
    ],
    shortcut: "/logo.jpg",
  },
  manifest: "/manifest.json",
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL || "https://empresas-monarca.vercel.app",
  },
  category: "ecommerce",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" data-scroll-behavior="smooth">
      <head>
        <meta name="theme-color" content="#1a0f0a" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-[#1a0f0a] antialiased">
        <ParticleBackground />
        {children}
        <ScrollToTop />
      </body>
    </html>
  );
}
