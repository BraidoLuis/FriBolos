import type { Metadata } from "next";
import { ThemeProvider } from "./contexts/theme-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "FriBolos",
  description:
    "Sistema de gestão para confeitaria, pedidos, produtos e clientes.",
  icons: {
    icon: "/FaviconFribolos.png",
    shortcut: "/FaviconFribolos.png",
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