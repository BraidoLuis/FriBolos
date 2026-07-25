"use client";

import {
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import { supabase } from "../lib/supabase";
import { mapProduct } from "../lib/mappers";

import type {
  Product,
  ProductRow,
  Role,
} from "../types";

type UseProductsOptions = {
  authLoading: boolean;
  role: Role | null;

  setToast: Dispatch<
    SetStateAction<string>
  >;
};

export function useProducts({
  authLoading,
  role,
  setToast,
}: UseProductsOptions) {
  const [products, setProducts] =
    useState<Product[]>([]);

  const showToast = useCallback(
    (
      message: string,
      duration = 2800
    ) => {
      setToast(message);

      window.setTimeout(() => {
        setToast("");
      }, duration);
    },
    [setToast]
  );

  useEffect(() => {
    if (authLoading || !role) {
      return;
    }

    let componentActive = true;

    async function loadProducts() {
      const { data, error } =
        await supabase
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
          .order("created_at", {
            ascending: false,
          });

      if (!componentActive) {
        return;
      }

      if (error) {
        console.error(
          "Erro ao carregar produtos:",
          error
        );

        showToast(
          "Não foi possível carregar os produtos."
        );

        return;
      }

      const productRows =
        (data || []) as ProductRow[];

      setProducts(
        productRows.map(mapProduct)
      );
    }

    void loadProducts();

    return () => {
      componentActive = false;
    };
  }, [
    authLoading,
    role,
    showToast,
  ]);

  async function handleStockChange(
    productId: Product["id"],
    newStock: number
    ) {
    const normalizedStock =
        Math.max(
        0,
        Math.floor(newStock)
        );

    try {
        const {
        error: stockError,
        } = await supabase
        .from("products")
        .update({
            stock_quantity:
            normalizedStock,

            updated_at:
            new Date().toISOString(),
        })
        .eq("id", productId);

        if (stockError) {
        console.error(
            "Erro ao atualizar estoque:",
            stockError
        );

        showToast(
            "Não foi possível atualizar o estoque."
        );

        return;
        }

        setProducts(currentProducts =>
        currentProducts.map(product =>
            product.id === productId
            ? {
                ...product,
                stock:
                    normalizedStock,
                }
            : product
        )
        );

        showToast(
        "Estoque atualizado!",
        1800
        );
    } catch (error) {
        console.error(
        "Erro inesperado ao atualizar estoque:",
        error
        );

        showToast(
        "Ocorreu um erro ao atualizar o estoque."
        );
    }
    }

    return {
        products,
        setProducts,
        handleStockChange,
    };
}