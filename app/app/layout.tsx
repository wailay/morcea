import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Morcéa Global",
  description: "Morcéa — Made for the chosen few.",
  keywords: [
    "Morcéa",
    "morcéa",
    "Morcea",
    "morcea",
    "mrcea",
    "morceaa",
    "mrcea clothing",
    "morcea clothing",
    "morcéa clothing",
    "morceaa clothing",
    "mrcea.com",
    "streetwear",
    "luxury clothing",
    "clothing brand",
  ],
  openGraph: {
    title: "Morcéa Global",
    description: "Morcéa — Made for the chosen few.",
    url: "https://mrcea.com",
    siteName: "Morcéa",
    type: "website",
  },
  icons: {
    icon: "/favicon.ico",
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

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Morcéa",
  alternateName: ["Morcea", "mrcea", "morceaa"],
  url: "https://mrcea.com",
  logo: "https://mrcea.com/favicon.ico",
  description:
    "Morcéa is a luxury streetwear label launching soon. Made for the chosen few.",
  sameAs: [
    "https://www.instagram.com/morceaa/",
    "https://www.tiktok.com/@morceaa",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="m-0 overflow-hidden bg-black min-h-screen">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <h1 className="sr-only">
          Morcéa — luxury streetwear, made for the chosen few. Join the waitlist
          for early access at mrcea.com.
        </h1>
        <noscript>
          <h2>Morcéa</h2>
          <p>
            Luxury streetwear label launching soon. Made for the chosen few.
            Join the waitlist at mrcea.com.
          </p>
        </noscript>
        {children}
      </body>
    </html>
  );
}
