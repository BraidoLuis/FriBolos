import type {
  Metadata,
} from "next";

import {
  PublicCatalog,
} from "../components/public/public-catalog";

export const metadata: Metadata = {
  title: "Catálogo",

  description:
    "Conheça o catálogo FriBolos com bolos, doces, cupcakes e encomendas artesanais para momentos especiais.",

  alternates: {
    canonical: "/catalogo",
  },

  openGraph: {
    title: "Catálogo FriBolos",
    description:
      "Conheça os produtos e encomendas artesanais do FriBolos.",
    url: "/catalogo",
  },
};

export default function PublicCatalogPage() {
  return <PublicCatalog />;
}