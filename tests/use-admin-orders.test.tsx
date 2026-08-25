// @vitest-environment jsdom

import type {
  Dispatch,
  SetStateAction,
} from "react";

import {
  act,
  renderHook,
  waitFor,
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
  AdminOrderRow,
  Role,
} from "../app/types";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  select: vi.fn(),
  order: vi.fn(),
  update: vi.fn(),
  updateEq: vi.fn(),
  rpc: vi.fn(),
  invoke: vi.fn(),
}));

vi.mock(
  "../app/lib/supabase",
  () => ({
    supabase: {
      from: mocks.from,
      rpc: mocks.rpc,

      functions: {
        invoke: mocks.invoke,
      },
    },
  })
);

import {
  useAdminOrders,
} from "../app/hooks/use-admin-orders";

function createAdminOrderRow(
  changes: Record<
    string,
    unknown
  > = {}
): AdminOrderRow {
  return {
    id: "order-1",
    user_id: "user-1",
    order_number: 15,
    customer_name:
      "José da Silva",
    customer_phone:
      "21999999999",
    status: "confirmed",
    payment_status: "pending",
    total_amount: 150,
    subtotal_amount: 140,
    delivery_fee: 10,
    fulfillment_type: "delivery",
    delivery_address:
      "Rua Principal, 100",
    delivery_date: "2026-08-30",
    delivery_time: "15:30:00",
    request_type: null,
    request_status: null,
    requested_delivery_date: null,
    requested_delivery_time: null,
    request_reason: null,
    created_at:
      "2026-08-20T12:00:00.000Z",

    order_items: [
      {
        product_name:
          "Bolo de Chocolate",
        quantity: 2,
      },
    ],

    ...changes,
  } as unknown as AdminOrderRow;
}

function renderUseAdminOrders({
  authLoading = false,
  role = "admin",
  setToast = vi.fn(),
}: {
  authLoading?: boolean;
  role?: Role | null;

  setToast?: ReturnType<
    typeof vi.fn
  >;
} = {}) {
  const hook = renderHook(
    ({
      currentAuthLoading,
      currentRole,
    }: {
      currentAuthLoading:
        boolean;

      currentRole:
        Role | null;
    }) =>
      useAdminOrders({
        authLoading:
          currentAuthLoading,

        role: currentRole,

        setToast:
          setToast as unknown as Dispatch<
            SetStateAction<string>
          >,
      }),

    {
      initialProps: {
        currentAuthLoading:
          authLoading,

        currentRole: role,
      },
    }
  );

  return {
    ...hook,
    setToast,
  };
}

beforeEach(() => {
  mocks.from.mockReset();
  mocks.select.mockReset();
  mocks.order.mockReset();
  mocks.update.mockReset();
  mocks.updateEq.mockReset();
  mocks.rpc.mockReset();
  mocks.invoke.mockReset();

  mocks.order.mockResolvedValue({
    data: [
      createAdminOrderRow(),
    ],
    error: null,
  });

  mocks.updateEq.mockResolvedValue({
    error: null,
  });

  mocks.rpc.mockResolvedValue({
    data: null,
    error: null,
  });

  mocks.invoke.mockResolvedValue({
    data: {
      success: true,
    },
    error: null,
  });

  mocks.select.mockReturnValue({
    order: mocks.order,
  });

  mocks.update.mockReturnValue({
    eq: mocks.updateEq,
  });

  mocks.from.mockReturnValue({
    select: mocks.select,
    update: mocks.update,
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
  "useAdminOrders - carregamento",
  () => {
    it("não consulta enquanto a autenticação carrega", () => {
      renderUseAdminOrders({
        authLoading: true,
      });

      expect(
        mocks.from
      ).not.toHaveBeenCalled();
    });

    it("não consulta para usuário cliente", () => {
      renderUseAdminOrders({
        role: "client",
      });

      expect(
        mocks.from
      ).not.toHaveBeenCalled();
    });

    it("não consulta sem usuário autenticado", () => {
      renderUseAdminOrders({
        role: null,
      });

      expect(
        mocks.from
      ).not.toHaveBeenCalled();
    });

    it("carrega e mapeia pedidos para administrador", async () => {
      const {
        result,
      } = renderUseAdminOrders();

        await waitFor(
        () => {
            expect(
            result.current.appOrders
            ).toHaveLength(1);
        },
        {
            timeout: 5000,
        }
        );

      expect(
        mocks.from
      ).toHaveBeenCalledWith(
        "orders"
      );

      expect(
        mocks.order
      ).toHaveBeenCalledWith(
        "created_at",
        {
          ascending: false,
        }
      );

      expect(
        result.current.appOrders[0]
      ).toMatchObject({
        databaseId: "order-1",
        id: "#15",
        client:
          "José da Silva",
        initials: "JD",
        item:
          "2× Bolo de Chocolate",
        status: "Confirmado",
        statusCode: "confirmed",
        date: "30/08/2026",
        time: "15:30",
        fulfillmentType:
          "delivery",
        deliveryAddress:
          "Rua Principal, 100",
      });
    });

    it("trata retorno nulo como lista vazia", async () => {
      mocks.order.mockResolvedValue({
        data: null,
        error: null,
      });

      const {
        result,
      } = renderUseAdminOrders();

      await waitFor(() => {
        expect(
          mocks.order
        ).toHaveBeenCalledOnce();
      });

      expect(
        result.current.appOrders
      ).toEqual([]);
    });

    it("mostra erro quando não consegue carregar", async () => {
      mocks.order.mockResolvedValue({
        data: null,

        error: {
          message:
            "Falha ao consultar pedidos",
        },
      });

      const {
        result,
        setToast,
      } = renderUseAdminOrders();

      await waitFor(() => {
        expect(
          setToast
        ).toHaveBeenCalledWith(
          "Não foi possível carregar os pedidos."
        );
      });

      expect(
        result.current.appOrders
      ).toEqual([]);
    });
  }
);

describe(
  "useAdminOrders - filtros",
  () => {
    beforeEach(() => {
      mocks.order.mockResolvedValue({
        data: [
          createAdminOrderRow(),

          createAdminOrderRow({
            id: "order-2",
            order_number: 20,
            customer_name:
              "Maria Souza",
            status: "completed",
            fulfillment_type:
              "pickup",
            delivery_address: null,

            order_items: [
              {
                product_name:
                  "Cupcake",
                quantity: 6,
              },
            ],
          }),
        ],

        error: null,
      });
    });

    it("filtra cliente ignorando acentos", async () => {
      const {
        result,
      } = renderUseAdminOrders();

      await waitFor(() => {
        expect(
          result.current.appOrders
        ).toHaveLength(2);
      });

      act(() => {
        result.current.setQuery(
          "jose"
        );
      });

      expect(
        result.current.filteredOrders
      ).toHaveLength(1);

      expect(
        result.current
          .filteredOrders[0]
          .client
      ).toBe("José da Silva");
    });

    it("filtra pelo número do pedido", async () => {
      const {
        result,
      } = renderUseAdminOrders();

      await waitFor(() => {
        expect(
          result.current.appOrders
        ).toHaveLength(2);
      });

      act(() => {
        result.current.setQuery(
          "#20"
        );
      });

      expect(
        result.current.filteredOrders
      ).toHaveLength(1);

      expect(
        result.current
          .filteredOrders[0].id
      ).toBe("#20");
    });

    it("filtra por status entregue", async () => {
      const {
        result,
      } = renderUseAdminOrders();

      await waitFor(() => {
        expect(
          result.current.appOrders
        ).toHaveLength(2);
      });

      act(() => {
        result.current.setQuery(
          "entregue"
        );
      });

      expect(
        result.current.filteredOrders
      ).toHaveLength(1);

      expect(
        result.current
          .filteredOrders[0]
          .statusCode
      ).toBe("completed");
    });

    it("filtra pela forma de recebimento", async () => {
      const {
        result,
      } = renderUseAdminOrders();

      await waitFor(() => {
        expect(
          result.current.appOrders
        ).toHaveLength(2);
      });

      act(() => {
        result.current.setQuery(
          "retirada"
        );
      });

      expect(
        result.current.filteredOrders
      ).toHaveLength(1);

      expect(
        result.current
          .filteredOrders[0]
          .fulfillmentType
      ).toBe("pickup");
    });

    it("retorna todos quando a busca está vazia", async () => {
      const {
        result,
      } = renderUseAdminOrders();

      await waitFor(() => {
        expect(
          result.current.appOrders
        ).toHaveLength(2);
      });

      act(() => {
        result.current.setQuery(
          "Maria"
        );
      });

      expect(
        result.current.filteredOrders
      ).toHaveLength(1);

      act(() => {
        result.current.setQuery("");
      });

      expect(
        result.current.filteredOrders
      ).toHaveLength(2);
    });

    it("retorna lista vazia sem correspondência", async () => {
      const {
        result,
      } = renderUseAdminOrders();

      await waitFor(() => {
        expect(
          result.current.appOrders
        ).toHaveLength(2);
      });

      act(() => {
        result.current.setQuery(
          "pedido inexistente"
        );
      });

      expect(
        result.current.filteredOrders
      ).toEqual([]);
    });
  }
);

describe(
  "useAdminOrders - atualização de status",
  () => {
    it("atualiza pedido para Entregue", async () => {
      const {
        result,
        setToast,
      } = renderUseAdminOrders();

      await waitFor(() => {
        expect(
          result.current.appOrders
        ).toHaveLength(1);
      });

      await act(async () => {
        await result.current
          .handleOrderStatusChange(
            "order-1",
            "Entregue"
          );
      });

      expect(
        mocks.update
      ).toHaveBeenCalledWith({
        status: "completed",
        updated_at:
          expect.any(String),
      });

      expect(
        mocks.updateEq
      ).toHaveBeenCalledWith(
        "id",
        "order-1"
      );

      expect(
        result.current.appOrders[0]
      ).toMatchObject({
        status: "Entregue",
        statusCode: "completed",
      });

      expect(
        setToast
      ).toHaveBeenCalledWith(
        "Status do pedido atualizado!"
      );

      expect(
        result.current
          .updatingOrderId
      ).toBeNull();
    });

    it("mantém status quando o banco retorna erro", async () => {
      mocks.updateEq.mockResolvedValue({
        error: {
          message:
            "Falha ao atualizar",
        },
      });

      const {
        result,
        setToast,
      } = renderUseAdminOrders();

      await waitFor(() => {
        expect(
          result.current.appOrders
        ).toHaveLength(1);
      });

      await act(async () => {
        await result.current
          .handleOrderStatusChange(
            "order-1",
            "Entregue"
          );
      });

      expect(
        result.current.appOrders[0]
          .statusCode
      ).toBe("confirmed");

      expect(
        setToast
      ).toHaveBeenCalledWith(
        "Não foi possível atualizar o status."
      );
    });

    it("trata exceção inesperada", async () => {
      mocks.updateEq.mockRejectedValue(
        new Error(
          "Sem conexão"
        )
      );

      const {
        result,
        setToast,
      } = renderUseAdminOrders();

      await waitFor(() => {
        expect(
          result.current.appOrders
        ).toHaveLength(1);
      });

      await act(async () => {
        await result.current
          .handleOrderStatusChange(
            "order-1",
            "Pronto"
          );
      });

      expect(
        result.current.appOrders[0]
          .statusCode
      ).toBe("confirmed");

      expect(
        setToast
      ).toHaveBeenCalledWith(
        "Ocorreu um erro ao atualizar o status."
      );
    });

    it("informa qual pedido está sendo atualizado", async () => {
      let resolveUpdate:
        | ((
            value: {
              error: null;
            }
          ) => void)
        | undefined;

      mocks.updateEq.mockReturnValue(
        new Promise(resolve => {
          resolveUpdate = resolve;
        })
      );

      const {
        result,
      } = renderUseAdminOrders();

      await waitFor(() => {
        expect(
          result.current.appOrders
        ).toHaveLength(1);
      });

      let updatePromise:
        Promise<void>;

      act(() => {
        updatePromise =
          result.current
            .handleOrderStatusChange(
              "order-1",
              "Pronto"
            );
      });

      expect(
        result.current
          .updatingOrderId
      ).toBe("order-1");

      await act(async () => {
        resolveUpdate?.({
          error: null,
        });

        await updatePromise!;
      });

      expect(
        result.current
          .updatingOrderId
      ).toBeNull();
    });
  }
);

describe(
  "useAdminOrders - solicitações",
  () => {
    function configureRequestOrder(
      changes: Record<
        string,
        unknown
      > = {}
    ) {
      mocks.order.mockResolvedValue({
        data: [
          createAdminOrderRow({
            request_type:
              "cancellation",

            request_status:
              "pending",

            request_reason:
              "Não precisarei mais do pedido.",

            ...changes,
          }),
        ],

        error: null,
      });
    }

    it("rejeita uma solicitação pelo RPC", async () => {
      configureRequestOrder();

      const {
        result,
        setToast,
      } = renderUseAdminOrders();

      await waitFor(() => {
        expect(
          result.current.appOrders
        ).toHaveLength(1);
      });

      await act(async () => {
        await result.current
          .resolveOrderRequest(
            result.current.appOrders[0],
            "rejected"
          );
      });

      expect(
        mocks.rpc
      ).toHaveBeenCalledWith(
        "resolve_order_request",
        {
          p_order_id: "order-1",
          p_decision: "rejected",
        }
      );

      expect(
        result.current.appOrders[0]
      ).toMatchObject({
        requestStatus: "rejected",
      });

      expect(
        result.current.appOrders[0]
          .request
      ).toBeUndefined();

      expect(
        setToast
      ).toHaveBeenCalledWith(
        "Solicitação rejeitada!"
      );
    });

    it("aprova cancelamento não pago pelo RPC", async () => {
      configureRequestOrder({
        payment_status: "pending",
      });

      const {
        result,
        setToast,
      } = renderUseAdminOrders();

      await waitFor(() => {
        expect(
          result.current.appOrders
        ).toHaveLength(1);
      });

      await act(async () => {
        await result.current
          .resolveOrderRequest(
            result.current.appOrders[0],
            "approved"
          );
      });

      expect(
        mocks.rpc
      ).toHaveBeenCalledWith(
        "resolve_order_request",
        {
          p_order_id: "order-1",
          p_decision: "approved",
        }
      );

      expect(
        mocks.invoke
      ).not.toHaveBeenCalled();

      expect(
        result.current.appOrders[0]
      ).toMatchObject({
        status: "Cancelado",
        statusCode: "cancelled",
        paymentStatus: "pending",
        requestStatus: "approved",
      });

      expect(
        result.current.appOrders[0]
          .request
      ).toBeUndefined();

      expect(
        setToast
      ).toHaveBeenCalledWith(
        "Solicitação aprovada!"
      );
    });

    it("aprova um reagendamento", async () => {
      configureRequestOrder({
        request_type:
          "reschedule",

        requested_delivery_date:
          "2026-09-10",

        requested_delivery_time:
          "18:45:00",
      });

      const {
        result,
        setToast,
      } = renderUseAdminOrders();

      await waitFor(() => {
        expect(
          result.current.appOrders
        ).toHaveLength(1);
      });

      await act(async () => {
        await result.current
          .resolveOrderRequest(
            result.current.appOrders[0],
            "approved"
          );
      });

      expect(
        result.current.appOrders[0]
      ).toMatchObject({
        date: "10/09/2026",
        time: "18:45",
        status: "Confirmado",
        statusCode: "confirmed",
        requestStatus: "approved",
      });

      expect(
        result.current.appOrders[0]
          .request
      ).toBeUndefined();

      expect(
        setToast
      ).toHaveBeenCalledWith(
        "Solicitação aprovada!"
      );
    });

    it("mantém data e horário quando o reagendamento não possui novos valores", async () => {
      configureRequestOrder({
        request_type:
          "reschedule",

        requested_delivery_date:
          null,

        requested_delivery_time:
          null,
      });

      const {
        result,
      } = renderUseAdminOrders();

      await waitFor(() => {
        expect(
          result.current.appOrders
        ).toHaveLength(1);
      });

      const previousDate =
        result.current.appOrders[0].date;

      const previousTime =
        result.current.appOrders[0].time;

      await act(async () => {
        await result.current
          .resolveOrderRequest(
            result.current.appOrders[0],
            "approved"
          );
      });

      expect(
        result.current.appOrders[0]
          .date
      ).toBe(previousDate);

      expect(
        result.current.appOrders[0]
          .time
      ).toBe(previousTime);
    });

    it("não altera o pedido quando o RPC retorna erro", async () => {
      configureRequestOrder();

      mocks.rpc.mockResolvedValue({
        data: null,

        error: {
          message:
            "Falha ao responder solicitação",
        },
      });

      const {
        result,
        setToast,
      } = renderUseAdminOrders();

      await waitFor(() => {
        expect(
          result.current.appOrders
        ).toHaveLength(1);
      });

      await act(async () => {
        await result.current
          .resolveOrderRequest(
            result.current.appOrders[0],
            "approved"
          );
      });

      expect(
        result.current.appOrders[0]
      ).toMatchObject({
        statusCode: "confirmed",
        requestStatus: "pending",
      });

      expect(
        setToast
      ).toHaveBeenCalledWith(
        "Não foi possível responder à solicitação."
      );
    });

    it("trata uma exceção inesperada do RPC", async () => {
      configureRequestOrder();

      mocks.rpc.mockRejectedValue(
        new Error("Sem conexão")
      );

      const {
        result,
        setToast,
      } = renderUseAdminOrders();

      await waitFor(() => {
        expect(
          result.current.appOrders
        ).toHaveLength(1);
      });

      await act(async () => {
        await result.current
          .resolveOrderRequest(
            result.current.appOrders[0],
            "approved"
          );
      });

      expect(
        result.current.appOrders[0]
          .requestStatus
      ).toBe("pending");

      expect(
        setToast
      ).toHaveBeenCalledWith(
        "Ocorreu um erro ao responder à solicitação."
      );
    });

    it.each([
      "paid",
      "refund_pending",
      "refunded",
    ])(
      "solicita reembolso no cancelamento com pagamento %s",
      async paymentStatus => {
        configureRequestOrder({
          payment_status:
            paymentStatus,
        });

        const {
          result,
          setToast,
        } = renderUseAdminOrders();

        await waitFor(() => {
          expect(
            result.current.appOrders
          ).toHaveLength(1);
        });

        await act(async () => {
          await result.current
            .resolveOrderRequest(
              result.current.appOrders[0],
              "approved"
            );
        });

        expect(
          mocks.invoke
        ).toHaveBeenCalledWith(
          "refund-stripe-payment",
          {
            body: {
              orderId: "order-1",
            },
          }
        );

        expect(
          mocks.rpc
        ).not.toHaveBeenCalled();

        expect(
          result.current.appOrders[0]
        ).toMatchObject({
          status: "Cancelado",
          statusCode: "cancelled",
          paymentStatus:
            "refund_pending",
          requestStatus:
            "approved",
        });

        expect(
          setToast
        ).toHaveBeenCalledWith(
          "Cancelamento aprovado e reembolso solicitado!"
        );
      }
    );

    it("mostra erro genérico quando a função de reembolso falha", async () => {
      configureRequestOrder({
        payment_status: "paid",
      });

      mocks.invoke.mockResolvedValue({
        data: null,

        error: {
          message:
            "Falha na função",
        },
      });

      const {
        result,
        setToast,
      } = renderUseAdminOrders();

      await waitFor(() => {
        expect(
          result.current.appOrders
        ).toHaveLength(1);
      });

      await act(async () => {
        await result.current
          .resolveOrderRequest(
            result.current.appOrders[0],
            "approved"
          );
      });

      expect(
        setToast
      ).toHaveBeenCalledWith(
        "Não foi possível solicitar o reembolso."
      );

      expect(
        result.current.appOrders[0]
      ).toMatchObject({
        statusCode: "confirmed",
        paymentStatus: "paid",
        requestStatus: "pending",
      });
    });

    it("mostra o erro retornado pelo contexto da função", async () => {
      configureRequestOrder({
        payment_status: "paid",
      });

      const context = new Response(
        JSON.stringify({
          error:
            "Pagamento não possui cobrança reembolsável.",
        }),
        {
          status: 400,

          headers: {
            "content-type":
              "application/json",
          },
        }
      );

      mocks.invoke.mockResolvedValue({
        data: null,

        error: {
          message:
            "Erro da função",

          context,
        },
      });

      const {
        result,
        setToast,
      } = renderUseAdminOrders();

      await waitFor(() => {
        expect(
          result.current.appOrders
        ).toHaveLength(1);
      });

      await act(async () => {
        await result.current
          .resolveOrderRequest(
            result.current.appOrders[0],
            "approved"
          );
      });

      expect(
        setToast
      ).toHaveBeenCalledWith(
        "Pagamento não possui cobrança reembolsável."
      );
    });

    it("mostra o erro retornado nos dados do reembolso", async () => {
      configureRequestOrder({
        payment_status: "paid",
      });

      mocks.invoke.mockResolvedValue({
        data: {
          success: false,

          error:
            "O pagamento já foi reembolsado.",
        },

        error: null,
      });

      const {
        result,
        setToast,
      } = renderUseAdminOrders();

      await waitFor(() => {
        expect(
          result.current.appOrders
        ).toHaveLength(1);
      });

      await act(async () => {
        await result.current
          .resolveOrderRequest(
            result.current.appOrders[0],
            "approved"
          );
      });

      expect(
        setToast
      ).toHaveBeenCalledWith(
        "O pagamento já foi reembolsado."
      );

      expect(
        result.current.appOrders[0]
          .statusCode
      ).toBe("confirmed");
    });

    it("usa mensagem alternativa quando o reembolso não retorna erro específico", async () => {
      configureRequestOrder({
        payment_status: "paid",
      });

      mocks.invoke.mockResolvedValue({
        data: {
          success: false,
        },

        error: null,
      });

      const {
        result,
        setToast,
      } = renderUseAdminOrders();

      await waitFor(() => {
        expect(
          result.current.appOrders
        ).toHaveLength(1);
      });

      await act(async () => {
        await result.current
          .resolveOrderRequest(
            result.current.appOrders[0],
            "approved"
          );
      });

      expect(
        setToast
      ).toHaveBeenCalledWith(
        "Não foi possível solicitar o reembolso."
      );
    });

    it("informa qual solicitação está sendo resolvida", async () => {
      configureRequestOrder();

      let resolveRequest:
        | ((value: {
            data: null;
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
      } = renderUseAdminOrders();

      await waitFor(() => {
        expect(
          result.current.appOrders
        ).toHaveLength(1);
      });

      let requestPromise:
        Promise<void>;

      act(() => {
        requestPromise =
          result.current
            .resolveOrderRequest(
              result.current.appOrders[0],
              "approved"
            );
      });

      expect(
        result.current
          .resolvingRequestId
      ).toBe("order-1");

      await act(async () => {
        resolveRequest?.({
          data: null,
          error: null,
        });

        await requestPromise!;
      });

      expect(
        result.current
          .resolvingRequestId
      ).toBeNull();
    });
  }
);