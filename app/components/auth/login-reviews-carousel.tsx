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

export function LoginReviewsCarousel() {
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
          "get_public_reviews",
          {
            p_limit: 6,
          }
        );

      if (!componentActive) {
        return;
      }

      if (error) {
        console.error(
          "Erro ao carregar avaliações públicas:",
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
      }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [reviews.length]);

  if (loading || reviews.length === 0) {
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
    <section
      className="login-reviews-carousel"
      aria-label="Avaliações de clientes"
    >
      <div className="login-review-heading">
        <span>★</span>

        <div>
          <small>
            QUEM PROVA, RECOMENDA
          </small>

          <strong>
            Avaliações dos nossos clientes
          </strong>
        </div>
      </div>

      <div
        className="login-review-content"
        key={`${currentReview.created_at}-${currentIndex}`}
      >
        <div
          className="login-review-stars"
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
          “{currentReview.comment}”
        </blockquote>

        <footer>
          <span className="login-review-avatar">
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
        <div className="login-review-controls">
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
    </section>
  );
}