"use client";

import {
  useEffect,
  useState,
} from "react";

import { supabase } from "../../lib/supabase";

type PublicReview = {
  rating: number;
  comment: string;
  created_at: string;
};

export function ClientReviewsCarousel() {
  const [reviews, setReviews] =
    useState<PublicReview[]>([]);

  const [currentIndex, setCurrentIndex] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let componentActive = true;

    async function loadReviews() {
      const { data, error } =
        await supabase.rpc(
          "get_public_reviews"
        );

      if (!componentActive) {
        return;
      }

      if (error) {
        console.error(
          "Erro ao carregar avaliações:",
          error
        );

        setLoading(false);
        return;
      }

      setReviews(
        (data || []) as PublicReview[]
      );

      setLoading(false);
    }

    void loadReviews();

    return () => {
      componentActive = false;
    };
  }, []);

  useEffect(() => {
    if (reviews.length <= 1) {
      return;
    }

    const interval =
      window.setInterval(() => {
        setCurrentIndex(current =>
          (current + 1) %
          reviews.length
        );
      }, 5500);

    return () => {
      window.clearInterval(interval);
    };
  }, [reviews.length]);

  if (loading) {
    return (
      <section className="client-reviews-section">
        <div className="client-section-heading">
          <div>
            <p className="eyebrow">
              EXPERIÊNCIAS DOCES
            </p>

            <h2>
              Quem prova, recomenda.
            </h2>
          </div>
        </div>

        <div className="client-review-loading">
          Carregando avaliações...
        </div>
      </section>
    );
  }

  if (reviews.length === 0) {
    return null;
  }

  const currentReview =
    reviews[currentIndex];

  function changeReview(direction: number) {
    setCurrentIndex(current => {
      return (
        current +
        direction +
        reviews.length
      ) % reviews.length;
    });
  }

  return (
    <section className="client-reviews-section">
      <div className="client-section-heading">
        <div>
          <p className="eyebrow">
            EXPERIÊNCIAS DOCES
          </p>

          <h2>
            Quem prova, recomenda.
          </h2>
        </div>

        <span>
          Avaliações de compras verificadas
        </span>
      </div>

      <article
        className="client-review-card"
        key={`${currentReview.created_at}-${currentIndex}`}
      >
        <span className="client-review-quote">
          “
        </span>

        <div className="client-review-body">
          <div
            className="client-review-stars"
            aria-label={`${currentReview.rating} de 5 estrelas`}
          >
            {Array.from(
              { length: 5 },
              (_, index) => (
                <span
                  key={index}
                  className={
                    index <
                    currentReview.rating
                      ? "filled"
                      : ""
                  }
                >
                  ★
                </span>
              )
            )}
          </div>

          <blockquote>
            {currentReview.comment}
          </blockquote>

          <footer>
            <span className="client-review-avatar">
              ♡
            </span>

            <div>
              <b>Cliente FriBolos</b>

              <small>
                Compra verificada
              </small>
            </div>
          </footer>
        </div>

        {reviews.length > 1 && (
          <div className="client-review-navigation">
            <button
              type="button"
              onClick={() =>
                changeReview(-1)
              }
              aria-label="Avaliação anterior"
            >
              ‹
            </button>

            <div>
              {reviews.map(
                (_, reviewIndex) => (
                  <button
                    key={reviewIndex}
                    type="button"
                    className={
                      reviewIndex ===
                      currentIndex
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setCurrentIndex(
                        reviewIndex
                      )
                    }
                    aria-label={`Ver avaliação ${
                      reviewIndex + 1
                    }`}
                  />
                )
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                changeReview(1)
              }
              aria-label="Próxima avaliação"
            >
              ›
            </button>
          </div>
        )}
      </article>
    </section>
  );
}