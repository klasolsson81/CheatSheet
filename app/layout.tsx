import type { Metadata } from "next";
import { Geist_Mono, Atkinson_Hyperlegible } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

// Atkinson Hyperlegible - optimized for readability (Next.js optimized)
const atkinson = Atkinson_Hyperlegible({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-atkinson",
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = "https://recon.klasolsson.se"; // Update with actual production URL
const ogImageUrl = `${siteUrl}/og-image.jpg`; // Add OG image to /public folder

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "RECON - AI-Powered B2B Sales Intelligence",
    template: "%s | RECON",
  },
  description: "AI-powered B2B sales intelligence tool that analyzes companies in real-time. Generate actionable insights, ice breakers, pain points, and sales hooks instantly.",
  keywords: [
    "B2B sales intelligence",
    "sales prospecting",
    "AI sales tool",
    "company research",
    "sales intelligence platform",
    "lead generation",
    "business intelligence",
    "Swedish company data",
    "Allabolag integration",
    "sales automation",
  ],
  authors: [{ name: "Klas Olsson" }],
  creator: "Klas Olsson",
  publisher: "RECON",
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
    locale: "en_US",
    alternateLocale: ["sv_SE"],
    url: siteUrl,
    title: "RECON - AI-Powered B2B Sales Intelligence",
    description: "AI-powered B2B sales intelligence tool that analyzes companies in real-time. Generate actionable insights instantly.",
    siteName: "RECON",
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "RECON - Tactical Sales Intelligence",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RECON - AI-Powered B2B Sales Intelligence",
    description: "AI-powered B2B sales intelligence tool. Generate actionable insights instantly.",
    images: [ogImageUrl],
    creator: "@klasolsson", // Update with actual Twitter handle
  },
  // TODO: Add icon files to /public directory to enable PWA icons
  // icons: {
  //   icon: [
  //     { url: "/favicon.ico", sizes: "any" },
  //     { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
  //     { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
  //   ],
  //   apple: [
  //     { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
  //   ],
  // },
  manifest: "/manifest.json",
  category: "technology",
  alternates: {
    canonical: siteUrl,
  },
};

// Separate viewport export (Next.js 15+ requirement)
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
    { media: "(prefers-color-scheme: light)", color: "#0f172a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${atkinson.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
