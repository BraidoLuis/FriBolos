export type Screen = "Visão geral" | "Pedidos" | "Orçamentos" | "Produção" | "Cardápio" | "Estoque" | "Clientes" | "Financeiro" | "Relatórios" | "Configurações";

export type Role = "admin" | "client";

export type FinancePaymentRow = {
  id: string;
  amount: number | string;
  status: string;
  paid_at: string | null;
  refunded_at: string | null;
  created_at: string;

  orders: {
    order_number: number;
  } | null;
};

export type ProductSalesRow = {
  order_id: string;
  product_name: string;
  quantity: number;
  unit_price: number | string;
};

export type CheckoutOrderOptions = {
  fulfillmentType:
    | "delivery"
    | "pickup";

  deliveryAddress: string;
  deliveryDate: string;
  deliveryTime: string;
};

export type OrderFilter =
  | "all"
  | "today"
  | "requests";

export type ClientOrderItemRow = {
  id: string;
  product_id: string | null;
  product_name: string;
  unit_price: number | string;
  quantity: number;
  customization: Record<string, string>;

  products: {
    image_url: string | null;
  }[];
};

export type ClientReviewRow = {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
};

export type ClientOrderRow = {
  id: string;
  order_number: number | string;
  status: string;
  payment_status: string;
  total_amount: number | string;
  subtotal_amount: number | string;
  delivery_fee: number | string;

  fulfillment_type:
    | "delivery"
    | "pickup";

  delivery_address: string | null;
  delivery_date: string | null;
  delivery_time: string | null;
  request_type: string | null;
  request_status: string | null;
  requested_delivery_date: string | null;
  requested_delivery_time: string | null;
  request_reason: string | null;
  created_at: string;
  order_items: ClientOrderItemRow[];
  reviews: ClientReviewRow[];
};

export type UserProfile = {
  full_name: string;
  role: Role;
  email: string;

  phone: string | null;
  birth_date: string | null;

  zip_code: string | null;
  street: string | null;
  address_number: string | null;
  complement: string | null;
  district: string | null;
  city: string | null;
};

export type AdminOrderItemRow = {
  product_name: string;
  quantity: number;
};

export type AdminOrderRow = {
  id: string;
  order_number: number | string;
  customer_name: string;
  customer_phone: string | null;
  status: string;
  payment_status: string;
  total_amount: number | string;
  subtotal_amount: number | string;
  delivery_fee: number | string;

  fulfillment_type:
    | "delivery"
    | "pickup";

  delivery_address: string | null;
  delivery_date: string | null;
  delivery_time: string | null;
  request_type: string | null;
  request_status: string | null;
  requested_delivery_date: string | null;
  user_id: string;
  requested_delivery_time: string | null;
  request_reason: string | null;
  created_at: string;
  order_items: AdminOrderItemRow[];
};

export type AppOrder = {
  databaseId: string;
  userId: string;
  id: string;
  client: string;
  initials: string;
  item: string;
  time: string;
  date: string;
  value: string;
  subtotalAmount?: number;
  deliveryFeeAmount?: number;

  fulfillmentType?:
    | "delivery"
    | "pickup";

  deliveryAddress?: string | null;
  status: string;
  statusCode: string;
  paymentStatus: string;
  createdAt: string;
  deliveryDateRaw: string | null;
  request?: string;

  requestType: string | null;
  requestStatus: string | null;
  requestedDate: string | null;
  requestedTime: string | null;
};

export type Product = {
  id: string | number;
  name: string;
  category: string;
  price: string;
  description: string;
  image: string;
  active: boolean;
  archived: boolean;
  preparation: string;
  minimum: string;
  featured: boolean;
  featuredOrder: number;
  stock: number;
  lowStock: number;
  customizable: boolean;
  options: string[];
};

export type ProductRow = {
  id: string;
  name: string;
  category: string;
  price: number | string;
  description: string | null;
  image_url: string | null;
  preparation_time: string | null;
  minimum_order: string | null;
  stock_quantity: number;
  low_stock_limit: number;
  is_active: boolean;
  is_archived: boolean;
  is_featured: boolean;
  featured_order: number | null;
  is_customizable: boolean;

  product_options?: {
    option_name: string;
  }[];
};

export type StoreSettings = {
  id: number;
  store_name: string;
  description: string | null;
  cnpj: string | null;

  contact_email: string | null;
  whatsapp: string | null;
  instagram: string | null;

  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;

  opening_time: string | null;
  closing_time: string | null;
  business_days: string | null;
  business_weekdays: number[];

  minimum_order_value: number;
  delivery_fee: number;

  accepts_orders: boolean;

  created_at: string;
  updated_at: string;
};

export type OrderCreationResult =
  | {
      success: true;
      orderId: string;
      orderNumber: number;
    }
  | {
      success: false;
      message: string;
    };

export type CartItem = { product: Product; quantity: number };

export type QuoteRow = {
  id: string;
  quote_number: number | string;
  order_id: string | null;
  customer_name: string;
  title: string;
  details: string;
  desired_date: string | null;
  desired_time: string | null;
  quoted_amount: number | string | null;
  admin_message: string | null;
  reference_image_url: string | null;
  status: string;
  created_at: string;
};

export type ClientProfileRow = {
  id: string;
  full_name: string;
  phone: string | null;
  created_at: string;
};

export type DashboardPaymentRow = {
  amount: number | string;
  status: string;
  paid_at: string | null;
  refunded_at: string | null;
};

export type Quote = {
  databaseId: string;
  orderId: string | null;
  id: string;
  client: string;
  item: string;
  details: string;
  value: string;
  status: string;
  statusCode: string;
  date: string;
  time: string;
  adminMessage: string;
  imagePath: string;
  image: string;
};

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  type: string;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  isRead: boolean;
  createdAt: string;
};

export type AppReview = {
  id: string;
  orderId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type ClientSection =
  | "inicio"
  | "catalogo"
  | "pedidos"
  | "orcamentos"
  | "novo"
  | "pagamento"
  | "avaliacao"
  | "perfil"
  ;