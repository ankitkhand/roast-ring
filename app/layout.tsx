import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import type { ReactNode } from "react";
import { siteConfig, siteUrl } from "@/lib/config";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `${siteConfig.gameName} | ${siteConfig.name}`, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: ["yo mama jokes", "AI roast battle", "roast battle", "comedy game"],
  alternates: { canonical: "/" },
  openGraph: {
    title: `${siteConfig.gameName} | ${siteConfig.name}`,
    description: siteConfig.description,
    url: "/",
    siteName: siteConfig.name,
    type: "website",
  },
  twitter: { card: "summary_large_image", title: `${siteConfig.gameName} | ${siteConfig.name}`, description: siteConfig.description },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();

  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">Skip to content</a>
        {children}
      </body>
      {gaMeasurementId ? <GoogleAnalytics gaId={gaMeasurementId} /> : null}
    </html>
  );
}
