import { supabase } from "./supabase";

export type DeliveryQuote = {
  quoteId: string;
  deliveryAddress: string;
  deliveryZipCode: string;
  distanceMeters: number;
  deliveryFeeCents: number;
  expiresAt: string;
};

export function normalizeDeliveryAddress(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeDeliveryZip(value: string) {
  return value.replace(/\D/g, "");
}

export function activeDeliveryQuote(
  quote: DeliveryQuote | null,
  address: string,
  zip: string
): DeliveryQuote | null {
  if (
    !quote ||
    quote.deliveryAddress !== normalizeDeliveryAddress(address) ||
    quote.deliveryZipCode !== normalizeDeliveryZip(zip) ||
    Date.parse(quote.expiresAt) <= Date.now() + 5000
  ) {
    return null;
  }

  return quote;
}

export async function requestDeliveryQuote(
  address: string,
  zip: string
): Promise<DeliveryQuote> {
  const deliveryAddress = normalizeDeliveryAddress(address);
  const deliveryZipCode = normalizeDeliveryZip(zip);

  if (
    deliveryAddress.length < 15 ||
    deliveryAddress.length > 250 ||
    !(/\d/.test(deliveryAddress) ||
      /\bS\s*\/?\s*N\b/i.test(deliveryAddress))
  ) {
    throw new Error(
      "Informe rua, número e bairro para a entrega."
    );
  }

  if (!/^\d{8}$/.test(deliveryZipCode)) {
    throw new Error("Informe um CEP válido.");
  }

  const { data, error } =
    await supabase.functions.invoke<DeliveryQuote>(
      "quote-delivery",
      {
        body: { deliveryAddress, deliveryZipCode },
      }
    );

  if (error) {
    const context = (
      error as { context?: Response }
    ).context;

    const body = context
      ? await context.clone().json().catch(() => null)
      : null;

    throw new Error(
      (body as { error?: string } | null)?.error ||
        "Não foi possível calcular o frete."
    );
  }

  if (
    !data?.quoteId ||
    !Number.isSafeInteger(data.deliveryFeeCents) ||
    !Number.isInteger(data.distanceMeters)
  ) {
    throw new Error("A cotação recebida é inválida.");
  }

  return data;
}