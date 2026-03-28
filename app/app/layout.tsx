import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Morcea",
  description:
    "Discover Morcea — a new standard in luxury fragrance. Join the waitlist for early access.",
  openGraph: {
    title: "Morcea",
    description:
      "Discover Morcea — a new standard in luxury fragrance. Join the waitlist for early access.",
    url: "https://mrcea.com",
    siteName: "Morcea",
    type: "website",
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
