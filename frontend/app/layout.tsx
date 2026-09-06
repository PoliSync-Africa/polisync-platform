import "./globals.css";
import "./visual-quality.css";
import "./dashboard-fixed-header.css";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://polisync-app.onrender.com").replace(/\/$/, "");

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "PoliSync Africa | Africa's Political Operating System",
    template: "%s | PoliSync Africa",
  },
  description:
    "PoliSync Africa is Africa's political technology platform for elections, political research, campaign operations, field work, election results, civic organizations and political intelligence.",
  applicationName: "PoliSync Africa",
  keywords: [
    "PoliSync Africa",
    "PoliSync",
    "political technology Africa",
    "election technology Ghana",
    "political research Africa",
    "campaign management Africa",
    "election results Ghana",
    "field operations",
    "political intelligence",
  ],
  authors: [{ name: "PoliSync Africa" }],
  creator: "PoliSync Africa",
  publisher: "PoliSync Africa",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_GH",
    url: "/",
    siteName: "PoliSync Africa",
    title: "PoliSync Africa | Africa's Political Operating System",
    description:
      "The political technology platform for elections, research, campaigns, field operations, results and political intelligence across Africa.",
    images: [
      {
        url: "/IMG_9654.jpeg",
        width: 1200,
        height: 630,
        alt: "PoliSync Africa",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PoliSync Africa | Africa's Political Operating System",
    description:
      "Political technology for elections, research, campaigns, field operations, results and political intelligence across Africa.",
    images: ["/IMG_9654.jpeg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/IMG_9654.jpeg",
    apple: "/IMG_9654.jpeg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
