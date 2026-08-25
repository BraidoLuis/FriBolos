// @vitest-environment jsdom

import type {
  ComponentProps,
} from "react";

import {
  fireEvent,
  render,
  screen,
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
  Product,
} from "../app/types";

afterEach(() => {
  vi.restoreAllMocks();
});

const {
  invokeMock,
} = vi.hoisted(() => ({
  invokeMock: vi.fn(),
}));

vi.mock(
  "../app/lib/supabase",
  () => ({
    supabase: {
      functions: {
        invoke: invokeMock,
      },
    },
  })
);

vi.mock(
  "../app/components/ui",
  () => ({
    Status: ({
      children,
    }: {
      children: React.ReactNode;
    }) => (
      <span>{children}</span>
    ),
  })
);

import {
  Payment,
} from "../app/components/client/payment";

function createPaymentProduct(
  changes: Partial<Product> = {}
): Product {
  return {
    id: "product-1",
    name: "Bolo de Chocolate",
    category: "Bolos",
    price: "R$ 100,00",
    description: "Bolo decorado.",
    image: "/bolo.webp",
    active: true,
    archived: false,
    preparation: "2 dias",
    minimum: "1 unidade",
    featured: false,
    featuredOrder: 0,
    stock: 10,
    lowStock: 2,
    customizable: false,
    options: [],
    ...changes,
  };
}

function inputDate(
  daysFromToday: number
) {
  const date = new Date();

  date.setDate(
    date.getDate() +
      daysFromToday
  );

  return [
    date.getFullYear(),

    String(
      date.getMonth() + 1
    ).padStart(2, "0"),

    String(
      date.getDate()
    ).padStart(2, "0"),
  ].join("-");
}

function renderPayment(
  changes: Partial<
    ComponentProps<typeof Payment>
  > = {}
) {
  const onPay =
    changes.onPay ||
    vi.fn().mockResolvedValue({
      success: true,
      orderId: "order-1",
      orderNumber: 15,
    });

  const onViewOrders =
    changes.onViewOrders ||
    vi.fn();

    const properties: ComponentProps<
    typeof Payment
    > = {
    paid: false,

    cart: [
        {
        product:
            createPaymentProduct(),
        quantity: 1,
        },
    ],

    returning: false,
    returnError: "",
    confirmedOrderNumber: null,
    minimumOrderValue: 0,
    deliveryFee: 10,
    acceptsOrders: true,
    storeAddress:
        "Rua da Confeitaria, 100",
    storeCity: "Guapimirim",
    storeState: "RJ",
    storeZipCode: "25940-000",
    openingTime: "09:00:00",
    closingTime: "18:00:00",
    businessDays:
        "Segunda a sábado",

    businessWeekdays: [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
    ],

    ...changes,
    onPay,
    onViewOrders,
    };

  return {
    ...render(
      <Payment {...properties} />
    ),

    onPay,
    onViewOrders,
  };
}

function chooseDelivery() {
  fireEvent.click(
    screen.getByRole("button", {
      name: /Receber em casa/i,
    })
  );
}

function deliveryAddressInput() {
  return screen.getByRole(
    "textbox",
    {
      name:
        /Endereço para entrega/i,
    }
  );
}

function fillSchedule({
  date = inputDate(2),
  time = "12:00",
}: {
  date?: string;
  time?: string;
} = {}) {
  fireEvent.change(
    screen.getByLabelText(
      "Data desejada"
    ),
    {
      target: {
        value: date,
      },
    }
  );

  fireEvent.change(
    screen.getByLabelText(
      "Horário preferido"
    ),
    {
      target: {
        value: time,
      },
    }
  );
}

function clickPayment() {
  fireEvent.click(
    screen.getByRole("button", {
      name: /Pagar/i,
    })
  );
}

describe("Payment - estados", () => {
  beforeEach(() => {
    sessionStorage.clear();
    invokeMock.mockReset();

    invokeMock.mockResolvedValue({
      data: null,
      error: {
        message:
          "Checkout indisponível no teste",
      },
    });

    vi.spyOn(
      console,
      "error"
    ).mockImplementation(() => {});
  });

  it("mostra a confirmação em processamento", () => {
    renderPayment({
      returning: true,
    });

    expect(
      screen.getByRole("heading", {
        name:
          "Confirmando seu pagamento...",
      })
    ).toBeInTheDocument();
  });

  it("mostra o estado de carrinho vazio", () => {
    renderPayment({
      cart: [],
    });

    expect(
      screen.getByRole("heading", {
        name:
          "Nenhum produto selecionado",
      })
    ).toBeInTheDocument();
  });

  it("mostra o estado de pagamento aprovado", () => {
    renderPayment({
      paid: true,
      confirmedOrderNumber: 15,
    });

    expect(
      screen.getByRole("heading", {
        name:
          "Sua encomenda está confirmada!",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByText("#15")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Confirmado")
    ).toBeInTheDocument();
  });

  it("abre os pedidos depois do pagamento", () => {
    const {
      onViewOrders,
    } = renderPayment({
      paid: true,
    });

    fireEvent.click(
      screen.getByRole("button", {
        name:
          /Ver meus pedidos/i,
      })
    );

    expect(
      onViewOrders
    ).toHaveBeenCalledOnce();
  });

  it("mostra erro recebido pelo retorno da Stripe", () => {
    renderPayment({
      returnError:
        "Pagamento não confirmado.",
    });

    expect(
      screen.getByRole("alert")
    ).toHaveTextContent(
      "Pagamento não confirmado."
    );
  });
});

describe("Payment - exibição do pedido", () => {
  beforeEach(() => {
    sessionStorage.clear();
    invokeMock.mockReset();

    invokeMock.mockResolvedValue({
      data: null,
      error: {
        message: "Erro simulado",
      },
    });

    vi.spyOn(
      console,
      "error"
    ).mockImplementation(() => {});
  });

  it("inicia com retirada no local", () => {
    renderPayment();

    expect(
      screen.getByText(
        "Retirada na confeitaria"
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /Rua da Confeitaria, 100/
      )
    ).toBeInTheDocument();

    expect(
    screen.getAllByText(
        /09:00 às 18:00/
    ).length
    ).toBeGreaterThan(0);
  });

  it("mostra subtotal e retirada grátis", () => {
    renderPayment();

    expect(
      screen.getByText("Grátis")
    ).toBeInTheDocument();

    expect(
      screen.getAllByText(
        "R$ 100,00"
      ).length
    ).toBeGreaterThan(0);
  });

  it("mostra o endereço quando entrega é selecionada", () => {
    renderPayment();

    chooseDelivery();

    const address =
        deliveryAddressInput()

    expect(address).toHaveAttribute(
      "minlength",
      "15"
    );

    expect(address).toHaveAttribute(
      "maxlength",
      "250"
    );

    expect(address).toHaveAttribute(
      "autocomplete",
      "street-address"
    );
  });

  it("adiciona a taxa ao selecionar entrega", () => {
    renderPayment();

    chooseDelivery();

    expect(
      screen.getByText(
        "Taxa de entrega"
      )
    ).toBeInTheDocument();

    expect(
      screen.getAllByText(
        "R$ 110,00"
      ).length
    ).toBeGreaterThan(0);
  });

  it("mostra aviso quando a loja não aceita pedidos", () => {
    renderPayment({
      acceptsOrders: false,
    });

    expect(
      screen.getByText(
        "Novas encomendas estão pausadas"
      )
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: /Pagar/i,
      })
    ).toBeDisabled();
  });

  it("mostra progresso do pedido mínimo", () => {
    const {
      container,
    } = renderPayment({
      minimumOrderValue: 200,
    });

    expect(
      screen.getByText(
        "Pedido mínimo ainda não atingido"
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /Adicione mais/
      )
    ).toHaveTextContent(
      "R$ 100,00"
    );

    expect(
      container.querySelector(
        ".payment-minimum-progress span"
      )
    ).toHaveStyle({
      width: "50%",
    });
  });

  it("informa quando o pedido mínimo foi atingido", () => {
    renderPayment({
      minimumOrderValue: 100,
    });

    expect(
      screen.getByText(
        "Valor mínimo atingido"
      )
    ).toBeInTheDocument();
  });
});

describe("Payment - validações", () => {
  beforeEach(() => {
    sessionStorage.clear();
    invokeMock.mockReset();

    invokeMock.mockResolvedValue({
      data: null,
      error: {
        message: "Erro simulado",
      },
    });

    vi.spyOn(
      console,
      "error"
    ).mockImplementation(() => {});
  });

  it("bloqueia pedido abaixo do valor mínimo", () => {
    renderPayment({
      minimumOrderValue: 150,
    });

    clickPayment();

    expect(
      screen.getByRole("alert")
    ).toHaveTextContent(
      /O pedido mínimo é de/
    );
  });

  it("exige endereço para entrega", () => {
    renderPayment();

    chooseDelivery();
    clickPayment();

    expect(
      screen.getByRole("alert")
    ).toHaveTextContent(
      "Informe o endereço para entrega."
    );
  });

  it("rejeita endereço muito curto", () => {
    renderPayment();

    chooseDelivery();

    fireEvent.change(
        deliveryAddressInput(),
      {
        target: {
          value: "Rua 1",
        },
      }
    );

    clickPayment();

    expect(
      screen.getByRole("alert")
    ).toHaveTextContent(
      /endereço mais completo/
    );
  });

  it("rejeita endereço sem letras", () => {
    renderPayment();

    chooseDelivery();

    fireEvent.change(
      deliveryAddressInput(),
      {
        target: {
          value:
            "12345678901234567890",
        },
      }
    );

    clickPayment();

    expect(
      screen.getByRole("alert")
    ).toHaveTextContent(
      "Informe um endereço válido."
    );
  });

  it("exige número ou S/N no endereço", () => {
    renderPayment();

    chooseDelivery();

    fireEvent.change(
      deliveryAddressInput(),
      {
        target: {
          value:
            "Rua das Flores, Centro",
        },
      }
    );

    clickPayment();

    expect(
      screen.getByRole("alert")
    ).toHaveTextContent(
      "Informe o número do endereço ou utilize S/N."
    );
  });

  it("aceita endereço identificado como S/N", () => {
    renderPayment();

    chooseDelivery();

    fireEvent.change(
      deliveryAddressInput(),
      {
        target: {
          value:
            "Rua das Flores, S/N, Centro",
        },
      }
    );

    clickPayment();

    expect(
      screen.getByRole("alert")
    ).toHaveTextContent(
      "Selecione a data desejada."
    );
  });

  it("rejeita endereço acima de 250 caracteres", () => {
    renderPayment();

    chooseDelivery();

    const longAddress =
      "Rua 123, " +
      "a".repeat(245);

    fireEvent.change(
      deliveryAddressInput(),
      {
        target: {
          value: longAddress,
        },
      }
    );

    clickPayment();

    expect(
      screen.getByRole("alert")
    ).toHaveTextContent(
      "O endereço deve possuir no máximo 250 caracteres."
    );
  });

  it("exige a data desejada", () => {
    renderPayment();

    clickPayment();

    expect(
      screen.getByRole("alert")
    ).toHaveTextContent(
      "Selecione a data desejada."
    );
  });

  it("rejeita data no passado", () => {
    renderPayment();

    fillSchedule({
      date: inputDate(-1),
    });

    clickPayment();

    expect(
      screen.getByRole("alert")
    ).toHaveTextContent(
      "A data do pedido não pode estar no passado."
    );
  });

  it("rejeita dia em que a confeitaria não funciona", () => {
    const selectedDate =
      inputDate(3);

    const selectedWeekday =
      new Date(
        `${selectedDate}T12:00:00`
      ).getDay();

    renderPayment({
      businessWeekdays: [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
      ].filter(
        weekday =>
          weekday !==
          selectedWeekday
      ),
    });

    fillSchedule({
      date: selectedDate,
    });

    clickPayment();

    expect(
      screen.getByRole("alert")
    ).toHaveTextContent(
      "A confeitaria não funciona na data selecionada."
    );
  });

  it("exige o horário preferido", () => {
    renderPayment();

    fireEvent.change(
      screen.getByLabelText(
        "Data desejada"
      ),
      {
        target: {
          value: inputDate(2),
        },
      }
    );

    clickPayment();

    expect(
      screen.getByRole("alert")
    ).toHaveTextContent(
      "Selecione o horário preferido."
    );
  });

  it("rejeita horário anterior à abertura", () => {
    renderPayment();

    fillSchedule({
      time: "08:59",
    });

    clickPayment();

    expect(
      screen.getByRole("alert")
    ).toHaveTextContent(
      "Selecione um horário a partir das 09:00."
    );
  });

  it("rejeita horário posterior ao fechamento", () => {
    renderPayment();

    fillSchedule({
      time: "18:01",
    });

    clickPayment();

    expect(
      screen.getByRole("alert")
    ).toHaveTextContent(
      "Selecione um horário até as 18:00."
    );
  });

  it("normaliza o endereço antes de criar o pedido", async () => {
    const onPay =
      vi.fn().mockResolvedValue({
        success: false,
        message:
          "Interrompendo antes da Stripe",
      });

    renderPayment({
      onPay,
    });

    chooseDelivery();

    fireEvent.change(
      deliveryAddressInput(),
      {
        target: {
          value:
            "  Rua   das Flores, 123, Centro  ",
        },
      }
    );

    fillSchedule();
    clickPayment();

    await waitFor(() => {
      expect(
        onPay
      ).toHaveBeenCalledWith({
        fulfillmentType:
          "delivery",

        deliveryAddress:
          "Rua das Flores, 123, Centro",

        deliveryDate:
          inputDate(2),

        deliveryTime: "12:00",
      });
    });
  });

  it("envia endereço vazio quando a opção é retirada", async () => {
    const onPay =
      vi.fn().mockResolvedValue({
        success: false,
        message:
          "Interrompendo antes da Stripe",
      });

    renderPayment({
      onPay,
    });

    fillSchedule();
    clickPayment();

    await waitFor(() => {
      expect(
        onPay
      ).toHaveBeenCalledWith({
        fulfillmentType:
          "pickup",

        deliveryAddress: "",
        deliveryDate:
          inputDate(2),
        deliveryTime: "12:00",
      });
    });
  });
});

describe(
  "Payment - integração simulada com Stripe",
  () => {
    beforeEach(() => {
      sessionStorage.clear();
      invokeMock.mockReset();

      vi.spyOn(
        console,
        "error"
      ).mockImplementation(() => {});
    });

    it("mostra erro retornado ao criar o pedido", async () => {
      const onPay =
        vi.fn().mockResolvedValue({
          success: false,
          message:
            "Não foi possível criar o pedido.",
        });

      renderPayment({
        onPay,
      });

      fillSchedule();
      clickPayment();

      expect(
        await screen.findByRole(
          "alert"
        )
      ).toHaveTextContent(
        "Não foi possível criar o pedido."
      );

      expect(
        invokeMock
      ).not.toHaveBeenCalled();
    });

    it("chama a Edge Function com o pedido criado", async () => {
      const onPay =
        vi.fn().mockResolvedValue({
          success: true,
          orderId: "order-created",
          orderNumber: 25,
        });

      invokeMock.mockResolvedValue({
        data: null,
        error: {
          message:
            "Interrompendo no teste",
        },
      });

      renderPayment({
        onPay,
      });

      fillSchedule();
      clickPayment();

      await waitFor(() => {
        expect(
          invokeMock
        ).toHaveBeenCalledWith(
          "create-stripe-checkout",
          {
            body: {
              orderId:
                "order-created",
            },
          }
        );
      });
    });

    it("mostra mensagem padrão quando a Edge Function falha", async () => {
      invokeMock.mockResolvedValue({
        data: null,
        error: {
          message:
            "Erro interno",
        },
      });

      renderPayment();

      fillSchedule();
      clickPayment();

      expect(
        await screen.findByRole(
          "alert"
        )
      ).toHaveTextContent(
        "Não foi possível abrir o pagamento seguro."
      );
    });

    it("mostra a mensagem enviada no contexto da Edge Function", async () => {
      const errorResponse =
        new Response(
          JSON.stringify({
            error:
              "Pagamento temporariamente indisponível.",
          }),
          {
            status: 400,

            headers: {
              "content-type":
                "application/json",
            },
          }
        );

      invokeMock.mockResolvedValue({
        data: null,

        error: {
          message:
            "Erro da função",

          context:
            errorResponse,
        },
      });

      renderPayment();

      fillSchedule();
      clickPayment();

      expect(
        await screen.findByRole(
          "alert"
        )
      ).toHaveTextContent(
        "Pagamento temporariamente indisponível."
      );
    });

    it("mostra erro retornado quando não há URL de checkout", async () => {
      invokeMock.mockResolvedValue({
        data: {
          error:
            "Nenhuma forma de pagamento disponível.",
        },

        error: null,
      });

      renderPayment();

      fillSchedule();
      clickPayment();

      expect(
        await screen.findByRole(
          "alert"
        )
      ).toHaveTextContent(
        "Nenhuma forma de pagamento disponível."
      );
    });

    it("mostra mensagem padrão quando a Stripe não retorna URL", async () => {
      invokeMock.mockResolvedValue({
        data: {},
        error: null,
      });

      renderPayment();

      fillSchedule();
      clickPayment();

      expect(
        await screen.findByRole(
          "alert"
        )
      ).toHaveTextContent(
        "A Stripe não retornou a página de pagamento."
      );
    });

    it("trata exceção inesperada ao criar o pedido", async () => {
      const onPay =
        vi.fn().mockRejectedValue(
          new Error(
            "Falha inesperada"
          )
        );

      renderPayment({
        onPay,
      });

      fillSchedule();
      clickPayment();

      expect(
        await screen.findByRole(
          "alert"
        )
      ).toHaveTextContent(
        "Ocorreu um erro ao iniciar o pagamento."
      );
    });

    it("trata exceção inesperada da Edge Function", async () => {
      invokeMock.mockRejectedValue(
        new Error(
          "Supabase indisponível"
        )
      );

      renderPayment();

      fillSchedule();
      clickPayment();

      expect(
        await screen.findByRole(
          "alert"
        )
      ).toHaveTextContent(
        "Ocorreu um erro ao iniciar o pagamento."
      );
    });

    it("reutiliza pedido pendente salvo na sessão", async () => {
      sessionStorage.setItem(
        "stripe-checkout-order-id",
        "saved-order"
      );

      sessionStorage.setItem(
        "stripe-checkout-order-number",
        "77"
      );

      const onPay =
        vi.fn().mockResolvedValue({
          success: true,
          orderId:
            "unexpected-order",
          orderNumber: 99,
        });

      invokeMock.mockResolvedValue({
        data: null,
        error: {
          message:
            "Interrompendo no teste",
        },
      });

      renderPayment({
        onPay,
      });

      fillSchedule();
      clickPayment();

      await waitFor(() => {
        expect(
          invokeMock
        ).toHaveBeenCalledWith(
          "create-stripe-checkout",
          {
            body: {
              orderId:
                "saved-order",
            },
          }
        );
      });

      expect(
        onPay
      ).not.toHaveBeenCalled();
    });

    it("mostra estado de processamento enquanto cria o pedido", async () => {
      const onPay =
        vi.fn().mockReturnValue(
          new Promise(() => {})
        );

      renderPayment({
        onPay,
      });

      fillSchedule();
      clickPayment();

      const button =
        await screen.findByRole(
          "button",
          {
            name:
              /Abrindo ambiente seguro/i,
          }
        );

      expect(button).toBeDisabled();
    });

    it("não reutiliza pedido salvo quando o identificador não corresponde", async () => {
    sessionStorage.setItem(
        "stripe-checkout-order-id",
        "saved-order"
    );

    sessionStorage.setItem(
        "stripe-checkout-order-number",
        "77"
    );

    const onPay =
        vi.fn().mockResolvedValue({
        success: false,
        message:
            "Novo pedido solicitado.",
        });

    renderPayment({
        onPay,
    });

    /*
    * Simula uma mudança no pedido salvo
    * depois que o componente carregou seu estado.
    */
    sessionStorage.setItem(
        "stripe-checkout-order-id",
        "different-order"
    );

    fillSchedule();
    clickPayment();

    await waitFor(() => {
        expect(
        onPay
        ).toHaveBeenCalledOnce();
    });

    expect(
        invokeMock
    ).not.toHaveBeenCalled();

    expect(
        await screen.findByRole(
        "alert"
        )
    ).toHaveTextContent(
        "Novo pedido solicitado."
    );
    });
  }
);