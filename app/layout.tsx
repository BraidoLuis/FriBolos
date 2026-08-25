import type {
  Metadata,
} from "next";

import {
  ThemeProvider,
} from "./contexts/theme-context";

import "./globals.css";

const siteDescription =
  "Encomendas artesanais para momentos especiais. Conheça o catálogo FriBolos, solicite produtos personalizados e acompanhe seus pedidos.";

export const metadata: Metadata = {
  metadataBase: new URL(
    "https://fri-bolos.vercel.app"
  ),

  title: {
    default:
      "FriBolos | Encomendas artesanais",
    template: "%s | FriBolos",
  },

  description: siteDescription,

  applicationName: "FriBolos",

  keywords: [
    "FriBolos",
    "confeitaria",
    "bolos personalizados",
    "doces personalizados",
    "cupcakes",
    "encomendas artesanais",
    "bolos de festa",
  ],

  creator: "FriBolos",
  publisher: "FriBolos",

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: "FriBolos",

    title:
      "FriBolos | Encomendas artesanais",

    description: siteDescription,

    images: [
      {
        url: "/FaviconFribolos.png",
        width: 1024,
        height: 1024,
        alt: "FriBolos",
      },
    ],
  },

  twitter: {
    card: "summary",

    title:
      "FriBolos | Encomendas artesanais",

    description: siteDescription,

    images: [
      "/FaviconFribolos.png",
    ],
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
    icon: "/FaviconFribolos.png",
    shortcut:
      "/FaviconFribolos.png",
    apple:
      "/FaviconFribolos.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}