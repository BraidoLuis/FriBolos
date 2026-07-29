export function priceNumber(
  price: string
) {
  return (
    Number(
      price
        .replace(/[^\d,]/g, "")
        .replace(",", ".")
    ) || 0
  );
}

export function normalizeSearch(
  value: string
) {
  return value
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .trim();
}

export function databasePrice(
  value: string
) {
  const sanitized = value
    .replace(/[^\d,.]/g, "")
    .trim();

  const normalized =
    sanitized.includes(",")
      ? sanitized
          .replace(/\./g, "")
          .replace(",", ".")
      : sanitized;

  return Number(normalized);
}

export function money(
  value: number
) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function getFirstName(
  fullName: string
) {
  return (
    fullName.trim().split(" ")[0] ||
    "Usuário"
  );
}

export function getInitials(
  fullName: string
) {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(
      name =>
        name[0]?.toUpperCase()
    )
    .join("");
}

export function orderStatusLabel(
  status: string
) {
  const labels: Record<
    string,
    string
  > = {
    pending: "Aguardando",
    confirmed: "Confirmado",
    awaiting_payment:
      "Aguardando pagamento",
    in_production: "Em produção",
    ready: "Pronto",
    completed: "Entregue",
    cancelled: "Cancelado",
  };

  return labels[status] || status;
}

export function orderStatusCode(
  label: string
) {
  const codes: Record<
    string,
    string
  > = {
    Aguardando: "pending",
    Confirmado: "confirmed",
    "Aguardando pagamento":
      "awaiting_payment",
    "Em produção":
      "in_production",
    Pronto: "ready",
    Entregue: "completed",
    Cancelado: "cancelled",
  };

  return codes[label] || "pending";
}

export function todayInputDate() {
  const today = new Date();

  const year = today.getFullYear();

  const month = String(
    today.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    today.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function maximumQuoteDate() {
  const date = new Date();

  date.setFullYear(
    date.getFullYear() + 1
  );

  const year =
    date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function minimumBirthDate() {
  const date = new Date();

  date.setFullYear(
    date.getFullYear() - 120
  );

  const year =
    date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function maximumBirthDate() {
  const date = new Date();

  const year =
    date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function formatZipCode(
  value: string
) {
  const digits = value
    .replace(/\D/g, "")
    .slice(0, 8);

  if (digits.length <= 5) {
    return digits;
  }

  return `${digits.slice(
    0,
    5
  )}-${digits.slice(5)}`;
}

export function formatOrderDate(
  date: string
) {
  return new Date(
    date
  ).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDeliveryDate(
  date: string | null
) {
  if (!date) {
    return "Data a combinar";
  }

  return new Date(
    `${date}T12:00:00`
  ).toLocaleDateString("pt-BR");
}