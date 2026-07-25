"use client";

import {
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import { supabase } from "../lib/supabase";

import type {
  ClientProfileRow,
  Role,
} from "../types";

type UseOrderClientsOptions = {
  modalOpen: boolean;
  role: Role | null;

  setToast: Dispatch<
    SetStateAction<string>
  >;
};

export function useOrderClients({
  modalOpen,
  role,
  setToast,
}: UseOrderClientsOptions) {
  const [
    orderClients,
    setOrderClients,
  ] = useState<ClientProfileRow[]>([]);

  const [
    orderClientsLoading,
    setOrderClientsLoading,
  ] = useState(false);

  useEffect(() => {
    let componentActive = true;

    async function loadOrderClients() {
      if (
        !modalOpen ||
        role !== "admin"
      ) {
        return;
      }

      setOrderClientsLoading(true);

      const {
        data,
        error,
      } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          phone,
          created_at
        `)
        .eq("role", "client")
        .order("full_name", {
          ascending: true,
        });

      if (!componentActive) {
        return;
      }

      if (error) {
        console.error(
          "Erro ao carregar clientes do pedido:",
          error
        );

        setToast(
          "Não foi possível carregar os clientes."
        );

        setTimeout(() => {
          setToast("");
        }, 2800);

        setOrderClientsLoading(false);
        return;
      }

      setOrderClients(
        (data || []) as ClientProfileRow[]
      );

      setOrderClientsLoading(false);
    }

    loadOrderClients();

    return () => {
      componentActive = false;
    };
  }, [
    modalOpen,
    role,
    setToast,
  ]);

  return {
    orderClients,
    orderClientsLoading,
  };
}