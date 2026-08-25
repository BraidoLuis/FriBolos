"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import { supabase } from "../../lib/supabase";
import { mapProduct } from "../../lib/mappers";

import type {
  Product,
  ProductRow,
  StoreSettings,
} from "../../types";

import { ThemeToggle } from "../theme-toggle";
import { PublicProductCard } from "./public-product-card";

type PublicReview = {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
};

type PublicReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

type PublicStoreSettings = Pick<
  StoreSettings,
  | "store_name"
  | "description"
  | "whatsapp"
  | "instagram"
  | "address"
  | "city"
  | "state"
  | "zip_code"
  | "opening_time"
  | "closing_time"
  | "business_days"
>;

const faqItems = [
  {
    question:
      "Como faço uma encomenda?",
    answer:
      "Acesse o catálogo, entre ou crie sua conta, escolha os produtos e informe a data desejada. Você poderá acompanhar o pedido pela área do cliente.",
  },
  {
    question:
      "Posso solicitar um produto personalizado?",
    answer:
      "Sim. Produtos personalizáveis permitem informar opções durante a compra. Para pedidos especiais, você também pode enviar uma solicitação de orçamento.",
  },
  {
    question:
      "Como funciona o pagamento?",
    answer:
      "Após a confirmação dos detalhes, o pagamento é realizado em ambiente seguro. O andamento pode ser acompanhado pela sua conta.",
  },
  {
    question:
      "Posso escolher entrega ou retirada?",
    answer:
      "Sim. As opções disponíveis, o endereço de retirada e a taxa de entrega são apresentados durante a finalização do pedido.",
  },
  {
    question:
      "Com quanta antecedência devo encomendar?",
    answer:
      "O prazo pode variar conforme o produto e a personalização. Consulte o tempo de preparo informado no catálogo.",
  },
];

function timeValue(
  value: string | null | undefined
) {
  return value
    ? value.slice(0, 5)
    : "";
}

export function PublicSite({
  onOpenLogin,
}: {
  onOpenLogin: () => void;
}) {
  const [
    featuredProducts,
    setFeaturedProducts,
  ] = useState<Product[]>([]);

  const [
    reviews,
    setReviews,
  ] = useState<PublicReview[]>([]);

  const [
    settings,
    setSettings,
  ] =
    useState<PublicStoreSettings | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let componentActive = true;

    async function loadPublicSite() {
      setLoading(true);

      const [
        productsResponse,
        reviewsResponse,
        settingsResponse,
      ] = await Promise.all([
        supabase
          .from("products")
          .select(`
            id,
            name,
            category,
            price,
            description,
            image_url,
            preparation_time,
            minimum_order,
            stock_quantity,
            low_stock_limit,
            is_active,
            is_archived,
            is_featured,
            featured_order,
            is_customizable,
            product_options (
              option_name
            )
          `)
          .eq("is_active", true)
          .eq("is_archived", false)
          .eq("is_featured", true)
          .order("featured_order", {
            ascending: true,
          })
          .limit(4),

        supabase.rpc(
        "get_public_reviews",
        {
            p_limit: 6,
        }
        ),

        supabase
          .from("store_settings")
          .select(`
            store_name,
            description,
            whatsapp,
            instagram,
            address,
            city,
            state,
            zip_code,
            opening_time,
            closing_time,
            business_days
          `)
          .eq("id", 1)
          .maybeSingle(),
      ]);

      if (!componentActive) {
        return;
      }

      if (productsResponse.error) {
        console.error(
          "Erro ao carregar destaques públicos:",
          productsResponse.error
        );

        setFeaturedProducts([]);
      } else {
        setFeaturedProducts(
          (
            productsResponse.data ||
            []
          ).map(row =>
            mapProduct(
              row as ProductRow
            )
          )
        );
      }

      if (reviewsResponse.error) {
        console.error(
          "Erro ao carregar avaliações públicas:",
          reviewsResponse.error
        );

        setReviews([]);
      } else {
        const reviewRows =
        (
            reviewsResponse.data ||
            []
        ) as PublicReviewRow[];

        setReviews(
        reviewRows.map(review => ({
            id: review.id,
            rating: Number(
            review.rating
            ),
            comment:
            review.comment || "",
            createdAt:
            review.created_at,
        }))
        );
      }

      if (settingsResponse.error) {
        console.error(
          "Erro ao carregar configurações públicas:",
          settingsResponse.error
        );

        setSettings(null);
      } else {
        setSettings(
          settingsResponse.data as
            | PublicStoreSettings
            | null
        );
      }

      setLoading(false);
    }

    void loadPublicSite();

    return () => {
      componentActive = false;
    };
  }, []);

  const storeName =
    settings?.store_name || "FriBolos";

  const address = [
    settings?.address,
    [
      settings?.city,
      settings?.state,
    ]
      .filter(Boolean)
      .join(" - "),
    settings?.zip_code
      ? `CEP ${settings.zip_code}`
      : "",
  ]
    .filter(Boolean)
    .join(" • ");

  const openingTime =
    timeValue(
      settings?.opening_time
    );

  const closingTime =
    timeValue(
      settings?.closing_time
    );

  const serviceHours =
    openingTime && closingTime
      ? `${openingTime} às ${closingTime}`
      : "";

  const whatsappDigits =
    settings?.whatsapp
      ?.replace(/\D/g, "") || "";

  const normalizedWhatsapp =
    whatsappDigits &&
    !whatsappDigits.startsWith("55")
      ? `55${whatsappDigits}`
      : whatsappDigits;

  const whatsappUrl =
    normalizedWhatsapp
      ? `https://wa.me/${normalizedWhatsapp}`
      : "";

  const instagramValue =
    settings?.instagram?.trim() || "";

  const instagramUrl =
    instagramValue.startsWith("http")
      ? instagramValue
      : instagramValue
        ? `https://instagram.com/${instagramValue.replace(
            /^@/,
            ""
          )}`
        : "";

  return (
    <main className="public-home">
      <header className="public-home-header">
        <a
          href="#inicio"
          className="public-home-brand"
          aria-label="Voltar ao início"
        >
          <img
            src="/FaviconFribolos.png"
            alt=""
          />

          <strong>{storeName}</strong>
        </a>

        <nav aria-label="Navegação principal">
          <a href="#destaques">
            Destaques
          </a>

          <a href="#como-funciona">
            Como funciona
          </a>

          <a href="#avaliacoes">
            Avaliações
          </a>

          <a href="#faq">
            FAQ
          </a>
        </nav>

        <div className="public-home-header-actions">
          <ThemeToggle />

          <button
            type="button"
            onClick={onOpenLogin}
          >
            Entrar
          </button>
        </div>
      </header>

      <section
        className="public-home-hero"
        id="inicio"
      >
        <img
          src="/FaviconFribolos.png"
          alt={`Logo ${storeName}`}
        />

        <p className="eyebrow">
          CONFEITARIA ARTESANAL
        </p>

        <h1>
          Momentos especiais merecem
          sabores inesquecíveis.
        </h1>

        <p>
          Bolos, doces e encomendas
          personalizadas preparados com
          carinho para celebrar cada ocasião.
        </p>

        <div className="public-home-hero-actions">
          <Link href="/catalogo">
            Ver catálogo
            <span>→</span>
          </Link>

          <button
            type="button"
            onClick={onOpenLogin}
          >
            Fazer encomenda
          </button>
        </div>

        <div className="public-home-benefits">
          <span>
            <i>♡</i>
            Produção artesanal
          </span>

          <span>
            <i>✦</i>
            Produtos personalizáveis
          </span>

          <span>
            <i>✓</i>
            Acompanhamento do pedido
          </span>
        </div>
      </section>

      <section
        className="public-home-section public-home-featured"
        id="destaques"
      >
        <header className="public-home-section-heading">
          <div>
            <p className="eyebrow">
              ESCOLHAS ESPECIAIS
            </p>

            <h2>
              Destaques da FriBolos
            </h2>
          </div>

          <Link href="/catalogo">
            Ver catálogo completo
            <span>→</span>
          </Link>
        </header>

        {loading ? (
          <div className="public-home-state">
            Preparando nossos destaques...
          </div>
        ) : featuredProducts.length > 0 ? (
          <div className="public-products-grid">
            {featuredProducts.map(
              product => (
                <PublicProductCard
                  key={product.id}
                  product={product}
                />
              )
            )}
          </div>
        ) : (
          <div className="public-home-state">
            <p>
              Nenhum produto foi marcado como
              destaque.
            </p>

            <Link href="/catalogo">
              Conhecer todos os produtos
            </Link>
          </div>
        )}
      </section>

      <section
        className="public-home-steps"
        id="como-funciona"
      >
        <div className="public-home-section-heading centered">
          <div>
            <p className="eyebrow">
              É SIMPLES
            </p>

            <h2>
              Sua encomenda em poucos passos
            </h2>
          </div>
        </div>

        <div className="public-home-steps-grid">
          <article>
            <span>01</span>
            <h3>Conheça o catálogo</h3>
            <p>
              Veja os produtos disponíveis,
              valores iniciais e prazos de
              preparação.
            </p>
          </article>

          <article>
            <span>02</span>
            <h3>Monte sua encomenda</h3>
            <p>
              Crie sua conta, escolha os produtos
              e informe os detalhes necessários.
            </p>
          </article>

          <article>
            <span>03</span>
            <h3>Acompanhe o pedido</h3>
            <p>
              Consulte atualizações, pagamento e
              andamento pela área do cliente.
            </p>
          </article>
        </div>

        <button
          type="button"
          onClick={onOpenLogin}
        >
          Entrar ou criar minha conta
          <span>→</span>
        </button>
      </section>

      <section
        className="public-home-section public-home-reviews"
        id="avaliacoes"
      >
        <div className="public-home-section-heading centered">
          <div>
            <p className="eyebrow">
              EXPERIÊNCIAS DOCES
            </p>

            <h2>
              O que nossos clientes dizem
            </h2>
          </div>
        </div>

        {!loading && reviews.length > 0 ? (
          <div className="public-home-reviews-grid">
            {reviews.map(review => (
              <article key={review.id}>
                <div
                  className="public-home-review-stars"
                  aria-label={`${review.rating} de 5 estrelas`}
                >
                  {"★".repeat(
                    Math.max(
                      0,
                      Math.min(
                        5,
                        review.rating
                      )
                    )
                  )}

                  <span>
                    {"★".repeat(
                      Math.max(
                        0,
                        5 - review.rating
                      )
                    )}
                  </span>
                </div>

                <p>
                  “
                  {review.comment.length > 200
                    ? `${review.comment
                        .slice(0, 200)
                        .trimEnd()}…`
                    : review.comment}
                  ”
                </p>

                <small>
                  Cliente FriBolos
                </small>
              </article>
            ))}
          </div>
        ) : (
          <div className="public-home-state">
            As avaliações aparecerão aqui em
            breve.
          </div>
        )}
      </section>

      <section
        className="public-home-faq"
        id="faq"
      >
        <div className="public-home-section-heading">
          <div>
            <p className="eyebrow">
              DÚVIDAS FREQUENTES
            </p>

            <h2>
              Antes de fazer sua encomenda
            </h2>
          </div>
        </div>

        <div className="public-home-faq-list">
          {faqItems.map(item => (
            <details key={item.question}>
              <summary>
                {item.question}
                <span>+</span>
              </summary>

              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="public-home-footer">
        <div className="public-home-footer-brand">
          <img
            src="/FaviconFribolos.png"
            alt=""
          />

          <div>
            <strong>{storeName}</strong>

            <p>
              {settings?.description ||
                "Encomendas feitas com carinho para momentos especiais."}
            </p>
          </div>
        </div>

        <div>
          <strong>Atendimento</strong>

          {settings?.business_days && (
            <span>
              {settings.business_days}
            </span>
          )}

          {serviceHours && (
            <span>
              {serviceHours}
            </span>
          )}

          {!settings?.business_days &&
            !serviceHours && (
              <span>
                Horários a confirmar
              </span>
            )}
        </div>

        <div>
          <strong>Onde estamos</strong>

          <span>
            {address ||
              "Endereço a confirmar"}
          </span>
        </div>

        <div>
          <strong>Contato</strong>

          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp
            </a>
          )}

          {instagramUrl && (
            <a
              href={instagramUrl}
              target="_blank"
              rel="noreferrer"
            >
              Instagram
            </a>
          )}

          {!whatsappUrl &&
            !instagramUrl && (
              <span>
                Contatos a confirmar
              </span>
            )}
        </div>

        <p className="public-home-copyright">
          © {new Date().getFullYear()}{" "}
          {storeName}. Todos os direitos
          reservados.
        </p>
      </footer>
    </main>
  );
}