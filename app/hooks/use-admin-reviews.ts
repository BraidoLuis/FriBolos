"use client";

import {
  useEffect,
  useState,
} from "react";

import { supabase } from "../lib/supabase";

import type {
  AppReview,
  Role,
  Screen,
} from "../types";

type UseAdminReviewsOptions = {
  authLoading: boolean;
  role: Role | null;
  screen: Screen;
};

export function useAdminReviews({
  authLoading,
  role,
  screen,
}: UseAdminReviewsOptions) {
  const [
    reviews,
    setReviews,
  ] = useState<AppReview[]>([]);

  const [
    reviewsLoading,
    setReviewsLoading,
  ] = useState(false);

  useEffect(() => {
    if (
      authLoading ||
      role !== "admin" ||
      screen !== "Relatórios"
    ) {
      return;
    }

    let componentActive = true;

    async function loadReviews() {
      setReviewsLoading(true);

      const {
        data,
        error: reviewsError,
      } = await supabase
        .from("reviews")
        .select(`
          id,
          order_id,
          user_id,
          rating,
          comment,
          created_at
        `)
        .order("created_at", {
          ascending: false,
        });

      if (!componentActive) {
        return;
      }

      if (reviewsError) {
        console.error(
          "Erro ao carregar avaliações:",
          reviewsError
        );

        setReviews([]);
        setReviewsLoading(false);
        return;
      }

      const mappedReviews:
        AppReview[] = (
        data || []
      ).map(review => ({
        id: review.id,
        orderId: review.order_id,
        userId: review.user_id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.created_at,
      }));

      setReviews(mappedReviews);
      setReviewsLoading(false);
    }

    loadReviews();

    return () => {
      componentActive = false;
    };
  }, [
    authLoading,
    role,
    screen,
  ]);

  return {
    reviews,
    reviewsLoading,
  };
}