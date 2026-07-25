import type {
  AdminOrderRow,
  AppOrder,
  Product,
  ProductRow,
  Quote,
  QuoteRow,
} from "../types";

import {
  formatDeliveryDate,
  getInitials,
  money,
  orderStatusLabel,
} from "./formatters";

export function mapProduct(
  row: ProductRow
): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: money(Number(row.price)),
    description: row.description || "",
    image: row.image_url || "",
    active: row.is_active,
    archived: row.is_archived,
    preparation:
      row.preparation_time || "",
    minimum: row.minimum_order || "",
    featured: row.is_featured,
    featuredOrder:
      row.featured_order || 0,
    stock: row.stock_quantity,
    lowStock: row.low_stock_limit,
    customizable: row.is_customizable,

    options: Array.from(
      new Set(
        (row.product_options || []).map(
          option => option.option_name
        )
      )
    ),
  };
}

export function mapAdminOrder(
  order: AdminOrderRow
): AppOrder {
  let request: string | undefined;

  if (
    order.request_status === "pending" &&
    order.request_type === "cancellation"
  ) {
    request = "Cancelamento solicitado";
  }

  if (
    order.request_status === "pending" &&
    order.request_type === "reschedule"
  ) {
    request =
      `Reagendamento solicitado para ${
        formatDeliveryDate(
          order.requested_delivery_date
        )
      }${
        order.requested_delivery_time
          ? ` às ${order.requested_delivery_time.slice(
              0,
              5
            )}`
          : ""
      }`;
  }

  return {
    databaseId: order.id,
    userId: order.user_id,
    id: `#${order.order_number}`,
    createdAt: order.created_at,
    deliveryDateRaw: order.delivery_date,
    client: order.customer_name,

    initials: getInitials(
      order.customer_name
    ),

    item: order.order_items
      .map(
        item =>
          `${item.quantity}× ${item.product_name}`
      )
      .join(", "),

    time: order.delivery_time
      ? order.delivery_time.slice(0, 5)
      : "A combinar",

    date: order.delivery_date
      ? formatDeliveryDate(
          order.delivery_date
        )
      : "Data a combinar",

    value: money(
      Number(order.total_amount)
    ),

    subtotalAmount: Number(
      order.subtotal_amount
    ),

    deliveryFeeAmount: Number(
      order.delivery_fee
    ),

    fulfillmentType:
      order.fulfillment_type,

    deliveryAddress:
      order.delivery_address,

    status: orderStatusLabel(
      order.status
    ),

    statusCode: order.status,
    paymentStatus: order.payment_status,
    request,
    requestType: order.request_type,
    requestStatus: order.request_status,

    requestedDate:
      order.requested_delivery_date,

    requestedTime:
      order.requested_delivery_time,
  };
}

export function quoteStatusLabel(
  status: string
) {
  const labels: Record<string, string> = {
    pending: "Em análise",
    in_review: "Em análise",
    awaiting_customer:
      "Aguardando cliente",
    approved: "Aprovado",
    rejected: "Recusado",
    cancelled: "Cancelado",
  };

  return labels[status] || status;
}

export function mapQuote(
  row: QuoteRow
): Quote {
  return {
    databaseId: row.id,
    orderId: row.order_id,
    id: `ORC-${row.quote_number}`,
    client: row.customer_name,
    item: row.title,
    details: row.details,

    value:
      row.quoted_amount === null
        ? "A definir"
        : money(
            Number(row.quoted_amount)
          ),

    status: quoteStatusLabel(
      row.status
    ),

    statusCode: row.status,

    date: row.desired_date
      ? formatDeliveryDate(
          row.desired_date
        )
      : "A combinar",

    time: row.desired_time
      ? row.desired_time.slice(0, 5)
      : "A combinar",

    adminMessage:
      row.admin_message || "",

    imagePath:
      row.reference_image_url || "",

    image: "",
  };
}