import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Morcéa (Morcea) — Luxury Clothing | mrcea.com",
  description:
    "Discover Morcéa (Morcea) — a new standard in luxury clothing. Visit mrcea.com and join the waitlist for early access to the Morcéa collection.",
  keywords: ["Morcéa", "Morcea", "morcea", "mrcea", "mrcea.com", "luxury clothing", "luxury fashion"],
  openGraph: {
    title: "Morcéa (Morcea) — Luxury Clothing",
    description:
      "Discover Morcéa (Morcea) — a new standard in luxury clothing. Visit mrcea.com and join the waitlist for early access.",
    url: "https://mrcea.com",
    siteName: "Morcéa",
    type: "website",
  },
  alternates: {
    canonical: "https://mrcea.com",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  userScalable: false,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="m-0 overflow-hidden bg-black min-h-screen">
        {children}
      </body>
    </html>
  );
}
