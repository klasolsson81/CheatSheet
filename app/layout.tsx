import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

// Atkinson Hyperlegible - optimized for readability
const atkinson = {
  variable: "--font-atkinson",
  className: "font-atkinson",
};

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RECON - Tactical Sales Intelligence",
  description: "Tactical intelligence for your next deal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${geistMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
