"use client";

import {
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";

import { supabase } from "../lib/supabase";

import type {
  Role,
  StoreSettings,
} from "../types";

const weekdayOptions = [
  { value: 0, label: "Dom" },
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
];

type UseStoreSettingsOptions = {
  authLoading: boolean;
  role: Role | null;

  setToast: Dispatch<
    SetStateAction<string>
  >;
};

export function useStoreSettings({
  authLoading,
  role,
  setToast,
}: UseStoreSettingsOptions) {
  const [
    storeSettings,
    setStoreSettings,
  ] = useState<StoreSettings | null>(null);

  const [
    storeSettingsLoading,
    setStoreSettingsLoading,
  ] = useState(true);

  const [
    savingStoreSettings,
    setSavingStoreSettings,
  ] = useState(false);

    const showToast = useCallback(
    (
        message: string,
        duration: number
    ) => {
        setToast(message);

        setTimeout(() => {
        setToast("");
        }, duration);
    },
    [setToast]
    );

  useEffect(() => {
    let componentActive = true;

    async function loadStoreSettings() {
      if (authLoading || !role) {
        return;
      }

      setStoreSettingsLoading(true);

      const {
        data,
        error,
      } = await supabase
        .from("store_settings")
        .select(`
          id,
          store_name,
          description,
          cnpj,
          contact_email,
          whatsapp,
          instagram,
          address,
          city,
          state,
          zip_code,
          opening_time,
          closing_time,
          business_days,
          business_weekdays,
          minimum_order_value,
          delivery_fee,
          accepts_orders,
          created_at,
          updated_at
        `)
        .eq("id", 1)
        .single();

      if (!componentActive) {
        return;
      }

      if (error) {
        console.error(
          "Erro ao carregar configurações:",
          error
        );

        setStoreSettings(null);
        setStoreSettingsLoading(false);

        showToast(
          "Não foi possível carregar as configurações.",
          2800
        );

        return;
      }

      setStoreSettings(
        data as StoreSettings
      );

      setStoreSettingsLoading(false);
    }

    loadStoreSettings();

    return () => {
      componentActive = false;
    };
  }, [
    authLoading,
    role,
    showToast,
    ]);

  async function saveStoreSettings(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const formData = new FormData(
      event.currentTarget
    );

    const businessWeekdays = formData
      .getAll("businessWeekdays")
      .map(value => Number(value))
      .filter(
        value =>
          Number.isInteger(value) &&
          value >= 0 &&
          value <= 6
      );

    if (businessWeekdays.length === 0) {
      showToast(
        "Selecione pelo menos um dia de funcionamento.",
        2800
      );

      return;
    }

    const selectedDayLabels =
      businessWeekdays.map(day => {
        const option = weekdayOptions.find(
          item => item.value === day
        );

        return option?.label || "";
      });

    const businessDaysLabel =
      selectedDayLabels.join(", ");

    const minimumOrderValue = Number(
      String(
        formData.get(
          "minimumOrderValue"
        ) || "0"
      ).replace(",", ".")
    );

    const deliveryFee = Number(
      String(
        formData.get("deliveryFee") ||
          "0"
      ).replace(",", ".")
    );

    setSavingStoreSettings(true);

    try {
      const {
        data,
        error,
      } = await supabase
        .from("store_settings")
        .update({
          store_name: String(
            formData.get("storeName") || ""
          ).trim(),

          description:
            String(
              formData.get("description") ||
                ""
            ).trim() || null,

          cnpj:
            String(
              formData.get("cnpj") || ""
            ).trim() || null,

          contact_email:
            String(
              formData.get("contactEmail") ||
                ""
            ).trim() || null,

          whatsapp:
            String(
              formData.get("whatsapp") ||
                ""
            ).trim() || null,

          instagram:
            String(
              formData.get("instagram") ||
                ""
            ).trim() || null,

          address:
            String(
              formData.get("address") || ""
            ).trim() || null,

          city:
            String(
              formData.get("city") || ""
            ).trim() || null,

          state:
            String(
              formData.get("state") || ""
            ).trim() || null,

          zip_code:
            String(
              formData.get("zipCode") || ""
            ).trim() || null,

          opening_time:
            String(
              formData.get("openingTime") ||
                ""
            ) || null,

          closing_time:
            String(
              formData.get("closingTime") ||
                ""
            ) || null,

          business_days:
            businessDaysLabel,

          business_weekdays:
            businessWeekdays,

          minimum_order_value:
            Number.isFinite(
              minimumOrderValue
            )
              ? minimumOrderValue
              : 0,

          delivery_fee:
            Number.isFinite(deliveryFee)
              ? deliveryFee
              : 0,

          accepts_orders:
            formData.get(
              "acceptsOrders"
            ) === "on",

          updated_at:
            new Date().toISOString(),
        })
        .eq("id", 1)
        .select()
        .single();

      if (error) {
        console.error(
          "Erro ao salvar configurações:",
          error
        );

        showToast(
          "Não foi possível salvar as configurações.",
          2800
        );

        return;
      }

      setStoreSettings(
        data as StoreSettings
      );

      showToast(
        "Configurações salvas com sucesso!",
        2400
      );
    } catch (error) {
      console.error(
        "Erro inesperado ao salvar configurações:",
        error
      );

      showToast(
        "Ocorreu um erro ao salvar as configurações.",
        2800
      );
    } finally {
      setSavingStoreSettings(false);
    }
  }

  return {
    storeSettings,
    storeSettingsLoading,
    savingStoreSettings,
    saveStoreSettings,
  };
}