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
  QuoteRow,
  Role,
} from "../app/types";

import {
  money,
} from "../app/lib/formatters";

const mocks = vi.hoisted(() => ({
  databaseFrom: vi.fn(),
  select: vi.fn(),
  order: vi.fn(),
  rpc: vi.fn(),

  storageFrom: vi.fn(),
  createSignedUrl: vi.fn(),
}));

vi.mock(
  "../app/lib/supabase",
  () => ({
    supabase: {
      from: mocks.databaseFrom,
      rpc: mocks.rpc,

      storage: {
        from: mocks.storageFrom,
      },
    },
  })
);

import {
  useQuotes,
} from "../app/hooks/use-quotes";

function createQuoteRow(
  changes: Record<
    string,
    unknown
  > = {}
): QuoteRow {
  return {
    id: "quote-1",
    quote_number: 10,
    order_id: null,
    customer_name:
      "Luis Felipe Braido",
    title:
      "Bolo de Festa Personalizável",
    details:
      "Tema azul e sabor chocolate.",
    desired_date: "2026-08-30",
    desired_time: "15:30:00",
    quoted_amount: null,
    admin_message: null,
    reference_image_url: null,
    status: "pending",
    created_at:
      "2026-08-20T12:00:00.000Z",
    ...changes,
  } as QuoteRow;
}

function renderUseQuotes({
  authLoading = false,
  role = "client",
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
      useQuotes({
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
  mocks.databaseFrom.mockReset();
  mocks.select.mockReset();
  mocks.order.mockReset();
  mocks.rpc.mockReset();
  mocks.storageFrom.mockReset();
  mocks.createSignedUrl.mockReset();

  mocks.order.mockResolvedValue({
    data: [
      createQuoteRow(),
    ],
    error: null,
  });

  mocks.rpc.mockResolvedValue({
    data: null,
    error: null,
  });

  mocks.createSignedUrl.mockResolvedValue({
    data: {
      signedUrl:
        "https://example.com/signed-image.webp",
    },
    error: null,
  });

  mocks.select.mockReturnValue({
    order: mocks.order,
  });

  mocks.databaseFrom.mockReturnValue({
    select: mocks.select,
  });

  mocks.storageFrom.mockReturnValue({
    createSignedUrl:
      mocks.createSignedUrl,
  });

  vi.spyOn(
    console,
    "error"
  ).mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useQuotes - carregamento", () => {
  it("não consulta enquanto a autenticação carrega", () => {
    renderUseQuotes({
      authLoading: true,
    });

    expect(
      mocks.databaseFrom
    ).not.toHaveBeenCalled();
  });

  it("não consulta sem usuário autenticado", () => {
    renderUseQuotes({
      role: null,
    });

    expect(
      mocks.databaseFrom
    ).not.toHaveBeenCalled();
  });

  it("carrega e mapeia os orçamentos", async () => {
    const {
      result,
    } = renderUseQuotes();

    await waitFor(() => {
      expect(
        result.current.quotes
      ).toHaveLength(1);
    });

    expect(
      mocks.databaseFrom
    ).toHaveBeenCalledWith(
      "quotes"
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
      result.current.quotes[0]
    ).toMatchObject({
      databaseId: "quote-1",
      id: "ORC-10",
      client:
        "Luis Felipe Braido",
      item:
        "Bolo de Festa Personalizável",
      value: "A definir",
      status: "Em análise",
      statusCode: "pending",
      date: "30/08/2026",
      time: "15:30",
    });
  });

  it("trata retorno nulo como lista vazia", async () => {
    mocks.order.mockResolvedValue({
      data: null,
      error: null,
    });

    const {
      result,
    } = renderUseQuotes();

    await waitFor(() => {
      expect(
        mocks.order
      ).toHaveBeenCalledOnce();
    });

    expect(
      result.current.quotes
    ).toEqual([]);
  });

  it("mostra erro quando não consegue carregar", async () => {
    mocks.order.mockResolvedValue({
      data: null,

      error: {
        message:
          "Falha ao consultar",
      },
    });

    const {
      result,
      setToast,
    } = renderUseQuotes();

    await waitFor(() => {
      expect(
        setToast
      ).toHaveBeenCalledWith(
        "Não foi possível carregar os orçamentos."
      );
    });

    expect(
      result.current.quotes
    ).toEqual([]);
  });

  it("cria URL assinada para imagem de referência", async () => {
    mocks.order.mockResolvedValue({
      data: [
        createQuoteRow({
          reference_image_url:
            "user/quote-image.webp",
        }),
      ],

      error: null,
    });

    const {
      result,
    } = renderUseQuotes();

    await waitFor(() => {
      expect(
        result.current.quotes[0]
          ?.image
      ).toBe(
        "https://example.com/signed-image.webp"
      );
    });

    expect(
      mocks.storageFrom
    ).toHaveBeenCalledWith(
      "quote-images"
    );

    expect(
      mocks.createSignedUrl
    ).toHaveBeenCalledWith(
      "user/quote-image.webp",
      3600
    );
  });

  it("mantém orçamento quando a imagem não pode ser carregada", async () => {
    mocks.order.mockResolvedValue({
      data: [
        createQuoteRow({
          reference_image_url:
            "user/missing.webp",
        }),
      ],

      error: null,
    });

    mocks.createSignedUrl.mockResolvedValue({
      data: null,

      error: {
        message:
          "Imagem indisponível",
      },
    });

    const {
      result,
    } = renderUseQuotes();

    await waitFor(() => {
      expect(
        result.current.quotes
      ).toHaveLength(1);
    });

    expect(
      result.current.quotes[0]
        .image
    ).toBe("");

    expect(
      result.current.quotes[0]
        .imagePath
    ).toBe(
      "user/missing.webp"
    );
  });
});

describe(
  "useQuotes - resposta do administrador",
  () => {
    it("rejeita valor vazio", async () => {
      const {
        result,
        setToast,
      } = renderUseQuotes({
        role: "admin",
      });

      await waitFor(() => {
        expect(
          result.current.quotes
        ).toHaveLength(1);
      });

      let success = true;

      await act(async () => {
        success =
          await result.current
            .handleAdminQuoteResponse(
              result.current
                .quotes[0],
              "",
              "Mensagem"
            );
      });

      expect(success).toBe(false);

      expect(
        mocks.rpc
      ).not.toHaveBeenCalled();

      expect(
        setToast
      ).toHaveBeenCalledWith(
        "Informe um valor válido para o orçamento."
      );
    });

    it("rejeita valor igual a zero", async () => {
      const {
        result,
      } = renderUseQuotes({
        role: "admin",
      });

      await waitFor(() => {
        expect(
          result.current.quotes
        ).toHaveLength(1);
      });

      let success = true;

      await act(async () => {
        success =
          await result.current
            .handleAdminQuoteResponse(
              result.current
                .quotes[0],
              "R$ 0,00",
              ""
            );
      });

      expect(success).toBe(false);

      expect(
        mocks.rpc
      ).not.toHaveBeenCalled();
    });

    it("envia proposta válida e atualiza o estado", async () => {
      const {
        result,
        setToast,
      } = renderUseQuotes({
        role: "admin",
      });

      await waitFor(() => {
        expect(
          result.current.quotes
        ).toHaveLength(1);
      });

      let success = false;

      await act(async () => {
        success =
          await result.current
            .handleAdminQuoteResponse(
              result.current
                .quotes[0],
              "R$ 250,50",
              "Proposta preparada."
            );
      });

      expect(success).toBe(true);

      expect(
        mocks.rpc
      ).toHaveBeenCalledWith(
        "admin_respond_quote",
        {
          p_quote_id:
            "quote-1",
          p_amount: 250.5,
          p_message:
            "Proposta preparada.",
        }
      );

      expect(
        result.current.quotes[0]
      ).toMatchObject({
        value: money(250.5),
        status:
          "Aguardando cliente",
        statusCode:
          "awaiting_customer",
        adminMessage:
          "Proposta preparada.",
      });

      expect(
        setToast
      ).toHaveBeenCalledWith(
        "Orçamento enviado ao cliente!"
      );

      expect(
        result.current
          .updatingQuoteId
      ).toBeNull();
    });

    it("envia mensagem vazia como null", async () => {
      const {
        result,
      } = renderUseQuotes({
        role: "admin",
      });

      await waitFor(() => {
        expect(
          result.current.quotes
        ).toHaveLength(1);
      });

      await act(async () => {
        await result.current
          .handleAdminQuoteResponse(
            result.current.quotes[0],
            "100",
            ""
          );
      });

      expect(
        mocks.rpc
      ).toHaveBeenCalledWith(
        "admin_respond_quote",
        expect.objectContaining({
          p_message: null,
        })
      );
    });

    it("mostra o orçamento que está sendo atualizado", async () => {
      let resolveRpc:
        | ((
            value: {
              data: null;
              error: null;
            }
          ) => void)
        | undefined;

      mocks.rpc.mockReturnValue(
        new Promise(resolve => {
          resolveRpc = resolve;
        })
      );

      const {
        result,
      } = renderUseQuotes({
        role: "admin",
      });

      await waitFor(() => {
        expect(
          result.current.quotes
        ).toHaveLength(1);
      });

      let responsePromise:
        Promise<boolean>;

      act(() => {
        responsePromise =
          result.current
            .handleAdminQuoteResponse(
              result.current
                .quotes[0],
              "150",
              ""
            );
      });

      expect(
        result.current
          .updatingQuoteId
      ).toBe("quote-1");

      await act(async () => {
        resolveRpc?.({
          data: null,
          error: null,
        });

        await responsePromise!;
      });

      expect(
        result.current
          .updatingQuoteId
      ).toBeNull();
    });

    it("trata erro retornado pelo banco", async () => {
      mocks.rpc.mockResolvedValue({
        data: null,

        error: {
          message:
            "Falha ao responder",
        },
      });

      const {
        result,
        setToast,
      } = renderUseQuotes({
        role: "admin",
      });

      await waitFor(() => {
        expect(
          result.current.quotes
        ).toHaveLength(1);
      });

      let success = true;

      await act(async () => {
        success =
          await result.current
            .handleAdminQuoteResponse(
              result.current
                .quotes[0],
              "200",
              ""
            );
      });

      expect(success).toBe(false);

      expect(
        result.current.quotes[0]
          .statusCode
      ).toBe("pending");

      expect(
        setToast
      ).toHaveBeenCalledWith(
        "Não foi possível enviar o orçamento."
      );
    });

    it("trata exceção inesperada", async () => {
      mocks.rpc.mockRejectedValue(
        new Error(
          "Sem conexão"
        )
      );

      const {
        result,
        setToast,
      } = renderUseQuotes({
        role: "admin",
      });

      await waitFor(() => {
        expect(
          result.current.quotes
        ).toHaveLength(1);
      });

      let success = true;

      await act(async () => {
        success =
          await result.current
            .handleAdminQuoteResponse(
              result.current
                .quotes[0],
              "200",
              ""
            );
      });

      expect(success).toBe(false);

      expect(
        setToast
      ).toHaveBeenCalledWith(
        "Ocorreu um erro ao enviar o orçamento."
      );
    });
  }
);

describe(
  "useQuotes - resposta do cliente",
  () => {
    it("aprova o orçamento", async () => {
      const {
        result,
      } = renderUseQuotes();

      await waitFor(() => {
        expect(
          result.current.quotes
        ).toHaveLength(1);
      });

      let success = false;

      await act(async () => {
        success =
          await result.current
            .handleClientQuoteResponse(
              "quote-1",
              "approved"
            );
      });

      expect(success).toBe(true);

      expect(
        mocks.rpc
      ).toHaveBeenCalledWith(
        "respond_to_quote",
        {
          p_quote_id:
            "quote-1",
          p_decision:
            "approved",
        }
      );

      expect(
        result.current.quotes[0]
      ).toMatchObject({
        status: "Aprovado",
        statusCode: "approved",
      });
    });

    it("recusa o orçamento", async () => {
      const {
        result,
      } = renderUseQuotes();

      await waitFor(() => {
        expect(
          result.current.quotes
        ).toHaveLength(1);
      });

      let success = false;

      await act(async () => {
        success =
          await result.current
            .handleClientQuoteResponse(
              "quote-1",
              "rejected"
            );
      });

      expect(success).toBe(true);

      expect(
        result.current.quotes[0]
      ).toMatchObject({
        status: "Recusado",
        statusCode: "rejected",
      });
    });

    it("mantém o orçamento quando o banco retorna erro", async () => {
      mocks.rpc.mockResolvedValue({
        data: null,

        error: {
          message:
            "Resposta recusada",
        },
      });

      const {
        result,
      } = renderUseQuotes();

      await waitFor(() => {
        expect(
          result.current.quotes
        ).toHaveLength(1);
      });

      let success = true;

      await act(async () => {
        success =
          await result.current
            .handleClientQuoteResponse(
              "quote-1",
              "approved"
            );
      });

      expect(success).toBe(false);

      expect(
        result.current.quotes[0]
          .statusCode
      ).toBe("pending");
    });

    it("trata exceção inesperada do cliente", async () => {
      mocks.rpc.mockRejectedValue(
        new Error(
          "Supabase indisponível"
        )
      );

      const {
        result,
      } = renderUseQuotes();

      await waitFor(() => {
        expect(
          result.current.quotes
        ).toHaveLength(1);
      });

      let success = true;

      await act(async () => {
        success =
          await result.current
            .handleClientQuoteResponse(
              "quote-1",
              "approved"
            );
      });

      expect(success).toBe(false);

      expect(
        result.current.quotes[0]
          .statusCode
      ).toBe("pending");
    });
  }
);