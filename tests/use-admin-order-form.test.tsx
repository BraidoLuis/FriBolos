// @vitest-environment jsdom

import {
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";

import {
  act,
  renderHook
} from "@testing-library/react";

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  AppOrder,
  ClientProfileRow,
  Product,
} from "../app/types";

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
}));

vi.mock(
  "../app/lib/supabase",
  () => ({
    supabase: {
      rpc: mocks.rpc,
    },
  })
);

import {
  useAdminOrderForm,
} from "../app/hooks/use-admin-order-form";

function createProduct(
  changes: Partial<Product> = {}
): Product {
  return {
    id: "product-1",
    name: "Bolo de Chocolate",
    category: "Bolos",
    price: "R$ 50,00",
    description: "Bolo artesanal",
    image: "",
    active: true,
    archived: false,
    preparation: "2 dias",
    minimum: "1 unidade",
    featured: false,
    featuredOrder: 0,
    stock: 10,
    lowStock: 2,
    customizable: true,
    options: [],

    ...changes,
  };
}

function createClient(
  changes: Partial<
    ClientProfileRow
  > = {}
): ClientProfileRow {
  return {
    id: "client-1",

    full_name:
      "José da Silva",

    phone: "21999999999",

    created_at:
      "2026-08-01T12:00:00.000Z",

    ...changes,
  };
}

function renderUseAdminOrderForm({
  products = [
    createProduct(),
  ],

  orderClients = [
    createClient(),
  ],

  initialOrders = [],

  setToast = vi.fn(),
  onClose = vi.fn(),
}: {
  products?: Product[];

  orderClients?:
    ClientProfileRow[];

  initialOrders?:
    AppOrder[];

  setToast?: ReturnType<
    typeof vi.fn
  >;

  onClose?: ReturnType<
    typeof vi.fn
  >;
} = {}) {
  const hook = renderHook(() => {
    const [
      currentProducts,
      setProducts,
    ] = useState(products);

    const [
      appOrders,
      setAppOrders,
    ] = useState<AppOrder[]>(
      initialOrders
    );

    const orderForm =
      useAdminOrderForm({
        products:
          currentProducts,

        setProducts,

        orderClients,

        setAppOrders,

        setToast:
          setToast as unknown as Dispatch<
            SetStateAction<string>
          >,

        onClose:
            onClose as unknown as () => void,
      });

    return {
      ...orderForm,
      products: currentProducts,
      appOrders,
    };
  });

  return {
    ...hook,
    setToast,
    onClose,
  };
}

type FormField = {
  name: string;
  value: string;
};

function createSubmitEvent(
  changes: FormField[] = []
) {
  const form =
    document.createElement("form");

  const defaultFields:
    FormField[] = [
      {
        name: "clientId",
        value: "client-1",
      },
      {
        name: "productId",
        value: "product-1",
      },
      {
        name: "quantity",
        value: "2",
      },
      {
        name: "deliveryDate",
        value: "2026-09-10",
      },
      {
        name: "deliveryTime",
        value: "15:30",
      },
      {
        name: "status",
        value: "confirmed",
      },
      {
        name: "fulfillmentType",
        value: "pickup",
      },
      {
        name: "deliveryAddress",
        value: "",
      },
      {
        name: "notes",
        value:
          "  Sem amendoim  ",
      },
    ];

  const changedNames =
    new Set(
      changes.map(
        field => field.name
      )
    );

  const fields = [
    ...defaultFields.filter(
      field =>
        !changedNames.has(
          field.name
        )
    ),

    ...changes,
  ];

  for (const field of fields) {
    const input =
      document.createElement(
        "input"
      );

    input.name = field.name;
    input.value = field.value;

    form.appendChild(input);
  }

  const preventDefault =
    vi.fn();

  const reset = vi.spyOn(
    form,
    "reset"
  );

  const event = {
    preventDefault,
    currentTarget: form,
  } as unknown as FormEvent<HTMLFormElement>;

  return {
    event,
    form,
    preventDefault,
    reset,
  };
}

beforeEach(() => {
  mocks.rpc.mockReset();

  mocks.rpc.mockResolvedValue({
    data: {
      order_id: "order-100",
      order_number: 100,
      subtotal_amount: 100,
      delivery_fee: 0,
      total_amount: 100,

      fulfillment_type:
        "pickup",

      delivery_address: null,
      status: "confirmed",
    },

    error: null,
  });

  vi.spyOn(
    console,
    "error"
  ).mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe(
  "useAdminOrderForm - estado",
  () => {
    it("inicia com retirada no local", () => {
      const {
        result,
      } = renderUseAdminOrderForm();

      expect(
        result.current
          .adminFulfillmentType
      ).toBe("pickup");

      expect(
        result.current.savingOrder
      ).toBe(false);
    });

    it("permite selecionar entrega", () => {
      const {
        result,
      } = renderUseAdminOrderForm();

      act(() => {
        result.current
          .setAdminFulfillmentType(
            "delivery"
          );
      });

      expect(
        result.current
          .adminFulfillmentType
      ).toBe("delivery");
    });
  }
);

describe(
  "useAdminOrderForm - validações",
  () => {
    it("impede o envio sem cliente válido", async () => {
      const {
        result,
        setToast,
      } = renderUseAdminOrderForm();

      const {
        event,
        preventDefault,
      } = createSubmitEvent([
        {
          name: "clientId",
          value: "",
        },
      ]);

      await act(async () => {
        await result.current
          .saveOrder(event);
      });

      expect(
        preventDefault
      ).toHaveBeenCalledOnce();

      expect(
        mocks.rpc
      ).not.toHaveBeenCalled();

      expect(
        setToast
      ).toHaveBeenCalledWith(
        "Selecione um cliente."
      );
    });

    it("impede o envio sem produto válido", async () => {
      const {
        result,
        setToast,
      } = renderUseAdminOrderForm();

      const {
        event,
      } = createSubmitEvent([
        {
          name: "productId",
          value:
            "produto-inexistente",
        },
      ]);

      await act(async () => {
        await result.current
          .saveOrder(event);
      });

      expect(
        mocks.rpc
      ).not.toHaveBeenCalled();

      expect(
        setToast
      ).toHaveBeenCalledWith(
        "Selecione um produto."
      );
    });

    it.each([
      ["zero", "0"],
      ["negativa", "-1"],
      ["fracionada", "1.5"],
      ["inválida", "abc"],
    ])(
      "rejeita quantidade %s",
      async (
        _description,
        quantity
      ) => {
        const {
          result,
          setToast,
        } =
          renderUseAdminOrderForm();

        const {
          event,
        } = createSubmitEvent([
          {
            name: "quantity",
            value: quantity,
          },
        ]);

        await act(async () => {
          await result.current
            .saveOrder(event);
        });

        expect(
          mocks.rpc
        ).not.toHaveBeenCalled();

        expect(
          setToast
        ).toHaveBeenCalledWith(
          "Informe uma quantidade válida."
        );
      }
    );

    it("rejeita quantidade superior ao estoque", async () => {
      const {
        result,
        setToast,
      } = renderUseAdminOrderForm({
        products: [
          createProduct({
            stock: 3,
          }),
        ],
      });

      const {
        event,
      } = createSubmitEvent([
        {
          name: "quantity",
          value: "4",
        },
      ]);

      await act(async () => {
        await result.current
          .saveOrder(event);
      });

      expect(
        mocks.rpc
      ).not.toHaveBeenCalled();

      expect(
        setToast
      ).toHaveBeenCalledWith(
        "Estoque disponível: 3."
      );
    });

    it("exige endereço válido para entrega", async () => {
      const {
        result,
        setToast,
      } = renderUseAdminOrderForm();

      const {
        event,
      } = createSubmitEvent([
        {
          name:
            "fulfillmentType",

          value: "delivery",
        },
        {
          name:
            "deliveryAddress",

          value: "Rua",
        },
      ]);

      await act(async () => {
        await result.current
          .saveOrder(event);
      });

      expect(
        mocks.rpc
      ).not.toHaveBeenCalled();

      expect(
        setToast
      ).toHaveBeenCalledWith(
        "Informe o endereço para entrega."
      );
    });

    it("não exige endereço para retirada", async () => {
      const {
        result,
      } = renderUseAdminOrderForm();

      const {
        event,
      } = createSubmitEvent([
        {
          name:
            "fulfillmentType",

          value: "pickup",
        },
        {
          name:
            "deliveryAddress",

          value: "",
        },
      ]);

      await act(async () => {
        await result.current
          .saveOrder(event);
      });

      expect(
        mocks.rpc
      ).toHaveBeenCalledOnce();
    });
  }
);

describe(
  "useAdminOrderForm - criação",
  () => {
    it("envia pedido de retirada ao RPC", async () => {
      const {
        result,
      } = renderUseAdminOrderForm();

      const {
        event,
      } = createSubmitEvent();

      await act(async () => {
        await result.current
          .saveOrder(event);
      });

      expect(
        mocks.rpc
      ).toHaveBeenCalledWith(
        "create_admin_order",
        {
          p_client_id:
            "client-1",

          p_items: [
            {
              product_id:
                "product-1",

              quantity: 2,

              customization: {},
            },
          ],

          p_status: "confirmed",

          p_delivery_date:
            "2026-09-10",

          p_delivery_time:
            "15:30",

          p_notes:
            "Sem amendoim",

          p_fulfillment_type:
            "pickup",

          p_delivery_address:
            null,
        }
      );
    });

    it("envia endereço normalizado para entrega", async () => {
      mocks.rpc.mockResolvedValue({
        data: {
          order_id: "order-101",
          order_number: 101,
          subtotal_amount: 100,
          delivery_fee: 15,
          total_amount: 115,

          fulfillment_type:
            "delivery",

          delivery_address:
            "Rua Principal, 100",

          status: "confirmed",
        },

        error: null,
      });

      const {
        result,
      } = renderUseAdminOrderForm();

      const {
        event,
      } = createSubmitEvent([
        {
          name:
            "fulfillmentType",

          value: "delivery",
        },
        {
          name:
            "deliveryAddress",

          value:
            "  Rua Principal, 100  ",
        },
      ]);

      await act(async () => {
        await result.current
          .saveOrder(event);
      });

      expect(
        mocks.rpc
      ).toHaveBeenCalledWith(
        "create_admin_order",
        expect.objectContaining({
          p_fulfillment_type:
            "delivery",

          p_delivery_address:
            "Rua Principal, 100",
        })
      );
    });

    it("converte data, horário e observações vazias para null", async () => {
      const {
        result,
      } = renderUseAdminOrderForm();

      const {
        event,
      } = createSubmitEvent([
        {
          name:
            "deliveryDate",
          value: "",
        },
        {
          name:
            "deliveryTime",
          value: "",
        },
        {
          name: "notes",
          value: "   ",
        },
      ]);

      await act(async () => {
        await result.current
          .saveOrder(event);
      });

      expect(
        mocks.rpc
      ).toHaveBeenCalledWith(
        "create_admin_order",
        expect.objectContaining({
          p_delivery_date: null,
          p_delivery_time: null,
          p_notes: null,
        })
      );
    });

    it("adiciona o pedido retornado no início da lista", async () => {
      const previousOrder = {
        databaseId: "old-order",
        id: "#99",
      } as AppOrder;

      const {
        result,
      } = renderUseAdminOrderForm({
        initialOrders: [
          previousOrder,
        ],
      });

      const {
        event,
      } = createSubmitEvent();

      await act(async () => {
        await result.current
          .saveOrder(event);
      });

      expect(
        result.current.appOrders
      ).toHaveLength(2);

      expect(
        result.current.appOrders[0]
      ).toMatchObject({
        databaseId:
          "order-100",

        userId: "client-1",
        id: "#100",

        client:
          "José da Silva",

        initials: "JD",

        item:
          "2× Bolo de Chocolate",

        time: "15:30",
        date: "10/09/2026",

        value: "R$ 100,00",

        subtotalAmount: 100,
        deliveryFeeAmount: 0,

        fulfillmentType:
          "pickup",

        deliveryAddress: null,

        status: "Confirmado",
        statusCode: "confirmed",

        paymentStatus:
          "pending",

        deliveryDateRaw:
          "2026-09-10",
      });

      expect(
        result.current.appOrders[1]
      ).toBe(previousOrder);
    });

    it("reduz o estoque do produto", async () => {
      const {
        result,
      } = renderUseAdminOrderForm({
        products: [
          createProduct({
            stock: 10,
          }),

          createProduct({
            id: "product-2",
            name: "Cupcake",
            stock: 20,
          }),
        ],
      });

      const {
        event,
      } = createSubmitEvent();

      await act(async () => {
        await result.current
          .saveOrder(event);
      });

      expect(
        result.current.products[0]
          .stock
      ).toBe(8);

      expect(
        result.current.products[1]
          .stock
      ).toBe(20);
    });

    it("limpa o formulário, fecha o modal e volta para retirada", async () => {
      const {
        result,
        onClose,
        setToast,
      } = renderUseAdminOrderForm();

      act(() => {
        result.current
          .setAdminFulfillmentType(
            "delivery"
          );
      });

      const {
        event,
        reset,
      } = createSubmitEvent([
        {
          name:
            "fulfillmentType",

          value: "delivery",
        },
        {
          name:
            "deliveryAddress",

          value:
            "Rua Principal, 100",
        },
      ]);

      await act(async () => {
        await result.current
          .saveOrder(event);
      });

      expect(
        reset
      ).toHaveBeenCalledOnce();

      expect(
        onClose
      ).toHaveBeenCalledOnce();

      expect(
        result.current
          .adminFulfillmentType
      ).toBe("pickup");

      expect(
        setToast
      ).toHaveBeenCalledWith(
        "Pedido #100 cadastrado com sucesso!"
      );
    });
  }
);

describe(
  "useAdminOrderForm - erros",
  () => {
    it("mostra o erro retornado pelo RPC", async () => {
      mocks.rpc.mockResolvedValue({
        data: null,

        error: {
          message:
            "Estoque insuficiente no banco.",
        },
      });

      const {
        result,
        setToast,
        onClose,
      } = renderUseAdminOrderForm();

      const {
        event,
      } = createSubmitEvent();

      await act(async () => {
        await result.current
          .saveOrder(event);
      });

      expect(
        setToast
      ).toHaveBeenCalledWith(
        "Estoque insuficiente no banco."
      );

      expect(
        result.current.appOrders
      ).toEqual([]);

      expect(
        onClose
      ).not.toHaveBeenCalled();

      expect(
        result.current.savingOrder
      ).toBe(false);
    });

    it("usa mensagem alternativa quando o erro não possui texto", async () => {
      mocks.rpc.mockResolvedValue({
        data: null,

        error: {
          message: "",
        },
      });

      const {
        result,
        setToast,
      } = renderUseAdminOrderForm();

      const {
        event,
      } = createSubmitEvent();

      await act(async () => {
        await result.current
          .saveOrder(event);
      });

      expect(
        setToast
      ).toHaveBeenCalledWith(
        "Não foi possível criar o pedido."
      );
    });

    it("trata uma exceção inesperada", async () => {
      mocks.rpc.mockRejectedValue(
        new Error("Sem conexão")
      );

      const {
        result,
        setToast,
      } = renderUseAdminOrderForm();

      const {
        event,
      } = createSubmitEvent();

      await act(async () => {
        await result.current
          .saveOrder(event);
      });

      expect(
        setToast
      ).toHaveBeenCalledWith(
        "Ocorreu um erro ao criar o pedido."
      );

      expect(
        result.current.appOrders
      ).toEqual([]);

      expect(
        result.current.savingOrder
      ).toBe(false);

      expect(
        console.error
      ).toHaveBeenCalled();
    });

    it("indica quando o pedido está sendo salvo", async () => {
      let resolveRequest:
        | ((value: {
            data: {
              order_id: string;
              order_number: number;
              subtotal_amount: number;
              delivery_fee: number;
              total_amount: number;

              fulfillment_type:
                "pickup";

              delivery_address:
                null;

              status: string;
            };

            error: null;
          }) => void)
        | undefined;

      mocks.rpc.mockReturnValue(
        new Promise(resolve => {
          resolveRequest = resolve;
        })
      );

      const {
        result,
      } = renderUseAdminOrderForm();

      const {
        event,
      } = createSubmitEvent();

      let savePromise:
        Promise<void>;

      act(() => {
        savePromise =
          result.current
            .saveOrder(event);
      });

      expect(
        result.current.savingOrder
      ).toBe(true);

      await act(async () => {
        resolveRequest?.({
          data: {
            order_id:
              "order-100",

            order_number: 100,
            subtotal_amount: 100,
            delivery_fee: 0,
            total_amount: 100,

            fulfillment_type:
              "pickup",

            delivery_address:
              null,

            status: "confirmed",
          },

          error: null,
        });

        await savePromise!;
      });

      expect(
        result.current.savingOrder
      ).toBe(false);
    });
  }
);