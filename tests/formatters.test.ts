// @vitest-environment node

import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  mapAdminOrder,
  mapProduct,
  mapQuote,
  quoteStatusLabel,
} from "../app/lib/mappers";

import {
  databasePrice,
  formatDeliveryDate,
  formatOrderDate,
  formatZipCode,
  getFirstName,
  getInitials,
  maximumBirthDate,
  maximumQuoteDate,
  minimumBirthDate,
  money,
  normalizeSearch,
  orderStatusCode,
  orderStatusLabel,
  priceNumber,
  todayInputDate,
} from "../app/lib/formatters";

describe("priceNumber", () => {
  it("converte preço em reais", () => {
    expect(
      priceNumber("R$ 25,90")
    ).toBe(25.9);
  });

  it("converte preço sem símbolo", () => {
    expect(
      priceNumber("100,50")
    ).toBe(100.5);
  });

  it("converte zero", () => {
    expect(
      priceNumber("R$ 0,00")
    ).toBe(0);
  });

  it("retorna zero para texto inválido", () => {
    expect(
      priceNumber("indefinido")
    ).toBe(0);
  });

  it("converte valor com milhar", () => {
    expect(
      priceNumber("R$ 1.234,56")
    ).toBe(1234.56);
  });
});

describe("normalizeSearch", () => {
  it("remove acentos", () => {
    expect(
      normalizeSearch(
        "Produção de Açúcar"
      )
    ).toBe("producao de acucar");
  });

  it("converte para letras minúsculas", () => {
    expect(
      normalizeSearch("FRIBOLOS")
    ).toBe("fribolos");
  });

  it("remove espaços das extremidades", () => {
    expect(
      normalizeSearch(
        "   Bolo de Festa   "
      )
    ).toBe("bolo de festa");
  });

  it("normaliza texto vazio", () => {
    expect(
      normalizeSearch("")
    ).toBe("");
  });
});

describe("databasePrice", () => {
  it("converte valor brasileiro", () => {
    expect(
      databasePrice("25,90")
    ).toBe(25.9);
  });

  it("remove símbolo de moeda", () => {
    expect(
      databasePrice("R$ 49,99")
    ).toBe(49.99);
  });

  it("converte valor com separador de milhar", () => {
    expect(
      databasePrice("1.234,56")
    ).toBe(1234.56);
  });

  it("aceita valor com ponto decimal", () => {
    expect(
      databasePrice("49.99")
    ).toBe(49.99);
  });

  it("retorna zero para string vazia", () => {
    expect(
      databasePrice("")
    ).toBe(0);
  });
});

describe("money", () => {
  function normalizeSpaces(
    value: string
  ) {
    return value.replace(/\s/g, " ");
  }

  it("formata valor em reais", () => {
    expect(
      normalizeSpaces(money(25.9))
    ).toBe("R$ 25,90");
  });

  it("formata zero em reais", () => {
    expect(
      normalizeSpaces(money(0))
    ).toBe("R$ 0,00");
  });

  it("formata valor com milhar", () => {
    expect(
      normalizeSpaces(
        money(1234.56)
      )
    ).toBe("R$ 1.234,56");
  });

  it("formata valor negativo", () => {
    expect(
      normalizeSpaces(money(-10))
    ).toBe("-R$ 10,00");
  });
});

describe("getFirstName", () => {
  it("retorna o primeiro nome", () => {
    expect(
      getFirstName(
        "Luis Felipe Braido"
      )
    ).toBe("Luis");
  });

  it("remove espaços antes do nome", () => {
    expect(
      getFirstName(
        "   Thiago Rodrigues"
      )
    ).toBe("Thiago");
  });

  it("retorna o próprio nome quando há somente um", () => {
    expect(
      getFirstName("Dayanne")
    ).toBe("Dayanne");
  });

  it("usa o nome padrão quando estiver vazio", () => {
    expect(
      getFirstName("   ")
    ).toBe("Usuário");
  });
});

describe("getInitials", () => {
  it("retorna as iniciais dos dois primeiros nomes", () => {
    expect(
      getInitials(
        "Luis Felipe dos Santos"
      )
    ).toBe("LF");
  });

  it("retorna uma inicial para nome único", () => {
    expect(
      getInitials("Luis")
    ).toBe("L");
  });

  it("ignora espaços duplicados", () => {
    expect(
      getInitials(
        "  Thiago   Rodrigues  "
      )
    ).toBe("TR");
  });

  it("retorna vazio para nome vazio", () => {
    expect(
      getInitials("")
    ).toBe("");
  });

  it("converte as iniciais para maiúsculas", () => {
    expect(
      getInitials(
        "luis braido"
      )
    ).toBe("LB");
  });
});

describe("status dos pedidos", () => {
  const statuses = [
    ["pending", "Aguardando"],
    ["confirmed", "Confirmado"],
    [
      "awaiting_payment",
      "Aguardando pagamento",
    ],
    [
      "in_production",
      "Em produção",
    ],
    ["ready", "Pronto"],
    ["completed", "Entregue"],
    ["cancelled", "Cancelado"],
  ] as const;

  it.each(statuses)(
    "converte o código %s para %s",
    (code, label) => {
      expect(
        orderStatusLabel(code)
      ).toBe(label);
    }
  );

  it.each(statuses)(
    "converte o texto %s de volta para o código",
    (code, label) => {
      expect(
        orderStatusCode(label)
      ).toBe(code);
    }
  );

  it("mantém um código desconhecido como texto", () => {
    expect(
      orderStatusLabel("unknown")
    ).toBe("unknown");
  });

  it("usa pending para uma descrição desconhecida", () => {
    expect(
      orderStatusCode(
        "Status desconhecido"
      )
    ).toBe("pending");
  });
});

describe("datas de formulários", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  function setTestDate() {
    vi.useFakeTimers();

    vi.setSystemTime(
      new Date(
        2026,
        7,
        25,
        12,
        0,
        0
      )
    );
  }

  it("retorna a data atual para inputs", () => {
    setTestDate();

    expect(
      todayInputDate()
    ).toBe("2026-08-25");
  });

  it("permite orçamento até um ano depois", () => {
    setTestDate();

    expect(
      maximumQuoteDate()
    ).toBe("2027-08-25");
  });

  it("permite nascimento de até 120 anos atrás", () => {
    setTestDate();

    expect(
      minimumBirthDate()
    ).toBe("1906-08-25");
  });

  it("usa hoje como data máxima de nascimento", () => {
    setTestDate();

    expect(
      maximumBirthDate()
    ).toBe("2026-08-25");
  });
});

describe("formatZipCode", () => {
  it("formata um CEP completo", () => {
    expect(
      formatZipCode("25940000")
    ).toBe("25940-000");
  });

  it("remove caracteres não numéricos", () => {
    expect(
      formatZipCode(
        "25.940-000"
      )
    ).toBe("25940-000");
  });

  it("mantém CEP incompleto", () => {
    expect(
      formatZipCode("25940")
    ).toBe("25940");
  });

  it("limita o CEP a oito números", () => {
    expect(
      formatZipCode(
        "259400001234"
      )
    ).toBe("25940-000");
  });

  it("retorna vazio para valor vazio", () => {
    expect(
      formatZipCode("")
    ).toBe("");
  });
});

describe("formatação de datas", () => {
  it("formata a data de um pedido", () => {
    expect(
      formatOrderDate(
        "2026-08-25T15:00:00.000Z"
      )
    ).toMatch(
      /^25 de ago\.? de 2026$/i
    );
  });

  it("formata a data de entrega", () => {
    expect(
      formatDeliveryDate(
        "2026-08-25"
      )
    ).toBe("25/08/2026");
  });

  it("informa quando a entrega não possui data", () => {
    expect(
      formatDeliveryDate(null)
    ).toBe("Data a combinar");
  });
});

type ProductRowInput =
  Parameters<
    typeof mapProduct
  >[0];

type AdminOrderRowInput =
  Parameters<
    typeof mapAdminOrder
  >[0];

type QuoteRowInput =
  Parameters<
    typeof mapQuote
  >[0];

function createProductRow(
  changes: Record<
    string,
    unknown
  > = {}
): ProductRowInput {
  return {
    id: "product-1",
    name: "Bolo de Chocolate",
    category: "Bolos",
    price: 89.9,
    description:
      "Bolo com recheio de chocolate.",
    image_url: "/bolo.webp",
    preparation_time: "2 dias",
    minimum_order: "1 unidade",
    stock_quantity: 10,
    low_stock_limit: 2,
    is_active: true,
    is_archived: false,
    is_featured: true,
    featured_order: 1,
    is_customizable: true,

    product_options: [
      {
        option_name: "Chocolate",
      },
      {
        option_name: "Morango",
      },
    ],

    ...changes,
  } as ProductRowInput;
}

function createAdminOrderRow(
  changes: Record<
    string,
    unknown
  > = {}
): AdminOrderRowInput {
  return {
    id: "order-1",
    user_id: "user-1",
    order_number: 15,
    created_at:
      "2026-08-20T12:00:00.000Z",
    delivery_date: "2026-08-25",
    delivery_time: "14:30:00",
    customer_name:
      "Luis Felipe Braido",

    order_items: [
      {
        quantity: 2,
        product_name:
          "Bolo de Chocolate",
      },
      {
        quantity: 1,
        product_name: "Cupcake",
      },
    ],

    total_amount: 150,
    subtotal_amount: 140,
    delivery_fee: 10,
    fulfillment_type: "delivery",
    delivery_address:
      "Rua Principal, 100",
    status: "confirmed",
    payment_status: "pending",
    request_type: null,
    request_status: null,
    requested_delivery_date: null,
    requested_delivery_time: null,

    ...changes,
  } as unknown as AdminOrderRowInput;
}

function createQuoteRow(
  changes: Record<
    string,
    unknown
  > = {}
): QuoteRowInput {
  return {
    id: "quote-1",
    quote_number: 10,
    order_id: null,
    customer_name:
      "Thiago Rodrigues",
    title:
      "Bolo de Festa Personalizável",
    details:
      "Tema azul, sabor chocolate.",
    desired_date: "2026-08-30",
    desired_time: "15:30:00",
    quoted_amount: 250,
    admin_message:
      "Podemos realizar sua encomenda.",
    reference_image_url:
      "/referencia.webp",
    status: "pending",
    created_at:
      "2026-08-20T12:00:00.000Z",

    ...changes,
  } as QuoteRowInput;
}

describe("mapProduct", () => {
  it("converte um produto do banco para o formato da aplicação", () => {
    const product = mapProduct(
      createProductRow()
    );

    expect(product).toEqual({
      id: "product-1",
      name: "Bolo de Chocolate",
      category: "Bolos",
      price: money(89.9),
      description:
        "Bolo com recheio de chocolate.",
      image: "/bolo.webp",
      active: true,
      archived: false,
      preparation: "2 dias",
      minimum: "1 unidade",
      featured: true,
      featuredOrder: 1,
      stock: 10,
      lowStock: 2,
      customizable: true,
      options: [
        "Chocolate",
        "Morango",
      ],
    });
  });

  it("converte preço recebido como texto", () => {
    const product = mapProduct(
      createProductRow({
        price: "125.50",
      })
    );

    expect(product.price).toBe(
      money(125.5)
    );
  });

  it("aplica valores vazios aos campos opcionais", () => {
    const product = mapProduct(
      createProductRow({
        description: null,
        image_url: null,
        preparation_time: null,
        minimum_order: null,
        featured_order: null,
        product_options: undefined,
      })
    );

    expect(product.description).toBe("");
    expect(product.image).toBe("");
    expect(product.preparation).toBe("");
    expect(product.minimum).toBe("");
    expect(product.featuredOrder).toBe(0);
    expect(product.options).toEqual([]);
  });

  it("remove opções duplicadas", () => {
    const product = mapProduct(
      createProductRow({
        product_options: [
          {
            option_name: "Chocolate",
          },
          {
            option_name: "Morango",
          },
          {
            option_name: "Chocolate",
          },
        ],
      })
    );

    expect(product.options).toEqual([
      "Chocolate",
      "Morango",
    ]);
  });
});

describe("mapAdminOrder", () => {
  it("converte um pedido administrativo", () => {
    const order = mapAdminOrder(
      createAdminOrderRow()
    );

    expect(order).toMatchObject({
      databaseId: "order-1",
      userId: "user-1",
      id: "#15",
      client:
        "Luis Felipe Braido",
      initials: "LF",
      item:
        "2× Bolo de Chocolate, 1× Cupcake",
      time: "14:30",
      date: "25/08/2026",
      value: money(150),
      subtotalAmount: 140,
      deliveryFeeAmount: 10,
      fulfillmentType: "delivery",
      deliveryAddress:
        "Rua Principal, 100",
      status: "Confirmado",
      statusCode: "confirmed",
      paymentStatus: "pending",
    });
  });

  it("usa valores alternativos quando não há data nem horário", () => {
    const order = mapAdminOrder(
      createAdminOrderRow({
        delivery_date: null,
        delivery_time: null,
      })
    );

    expect(order.date).toBe(
      "Data a combinar"
    );

    expect(order.time).toBe(
      "A combinar"
    );
  });

  it("identifica solicitação de cancelamento pendente", () => {
    const order = mapAdminOrder(
      createAdminOrderRow({
        request_type:
          "cancellation",
        request_status: "pending",
      })
    );

    expect(order.request).toBe(
      "Cancelamento solicitado"
    );
  });

  it("identifica solicitação de reagendamento com horário", () => {
    const order = mapAdminOrder(
      createAdminOrderRow({
        request_type: "reschedule",
        request_status: "pending",

        requested_delivery_date:
          "2026-08-30",

        requested_delivery_time:
          "18:45:00",
      })
    );

    expect(order.request).toBe(
      "Reagendamento solicitado para 30/08/2026 às 18:45"
    );
  });

  it("identifica reagendamento sem horário", () => {
    const order = mapAdminOrder(
      createAdminOrderRow({
        request_type: "reschedule",
        request_status: "pending",

        requested_delivery_date:
          "2026-08-30",

        requested_delivery_time:
          null,
      })
    );

    expect(order.request).toBe(
      "Reagendamento solicitado para 30/08/2026"
    );
  });

  it("não mostra solicitação já resolvida", () => {
    const order = mapAdminOrder(
      createAdminOrderRow({
        request_type:
          "cancellation",
        request_status:
          "approved",
      })
    );

    expect(
      order.request
    ).toBeUndefined();
  });

  it("converte valores numéricos recebidos como texto", () => {
    const order = mapAdminOrder(
      createAdminOrderRow({
        total_amount: "199.90",
        subtotal_amount: "189.90",
        delivery_fee: "10",
      })
    );

    expect(order.value).toBe(
      money(199.9)
    );

    expect(
      order.subtotalAmount
    ).toBe(189.9);

    expect(
      order.deliveryFeeAmount
    ).toBe(10);
  });
});

describe("quoteStatusLabel", () => {
  it.each([
    ["pending", "Em análise"],
    ["in_review", "Em análise"],
    [
      "awaiting_customer",
      "Aguardando cliente",
    ],
    ["approved", "Aprovado"],
    ["rejected", "Recusado"],
    ["cancelled", "Cancelado"],
  ])(
    "converte %s para %s",
    (status, label) => {
      expect(
        quoteStatusLabel(status)
      ).toBe(label);
    }
  );

  it("mantém um status desconhecido", () => {
    expect(
      quoteStatusLabel("unknown")
    ).toBe("unknown");
  });
});

describe("mapQuote", () => {
  it("converte um orçamento do banco", () => {
    const quote = mapQuote(
      createQuoteRow()
    );

    expect(quote).toEqual({
      databaseId: "quote-1",
      orderId: null,
      id: "ORC-10",
      client:
        "Thiago Rodrigues",
      item:
        "Bolo de Festa Personalizável",
      details:
        "Tema azul, sabor chocolate.",
      value: money(250),
      status: "Em análise",
      statusCode: "pending",
      date: "30/08/2026",
      time: "15:30",
      adminMessage:
        "Podemos realizar sua encomenda.",
      imagePath:
        "/referencia.webp",
      image: "",
    });
  });

  it("mostra valor a definir quando ainda não há proposta", () => {
    const quote = mapQuote(
      createQuoteRow({
        quoted_amount: null,
      })
    );

    expect(quote.value).toBe(
      "A definir"
    );
  });

  it("usa valores alternativos para campos opcionais", () => {
    const quote = mapQuote(
      createQuoteRow({
        desired_date: null,
        desired_time: null,
        admin_message: null,
        reference_image_url: null,
      })
    );

    expect(quote.date).toBe(
      "A combinar"
    );

    expect(quote.time).toBe(
      "A combinar"
    );

    expect(quote.adminMessage).toBe("");
    expect(quote.imagePath).toBe("");
  });

  it("preserva os detalhes completos do orçamento", () => {
    const details =
      "a".repeat(300);

    const quote = mapQuote(
      createQuoteRow({
        details,
      })
    );

    expect(
      quote.details
    ).toHaveLength(300);

    expect(
      quote.details
    ).toBe(details);
  });
});