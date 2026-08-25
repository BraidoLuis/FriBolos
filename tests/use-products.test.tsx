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
  ProductRow,
  Role,
} from "../app/types";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  select: vi.fn(),
  order: vi.fn(),
  update: vi.fn(),
  updateEq: vi.fn(),
}));

vi.mock(
  "../app/lib/supabase",
  () => ({
    supabase: {
      from: mocks.from,
    },
  })
);

import {
  useProducts,
} from "../app/hooks/use-products";

function createProductRow(
  changes: Record<
    string,
    unknown
  > = {}
): ProductRow {
  return {
    id: "product-1",
    name: "Bolo de Chocolate",
    category: "Bolos",
    price: 89.9,
    description:
      "Bolo com recheio cremoso.",
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
        option_name:
          "Chocolate",
      },
      {
        option_name: "Morango",
      },
    ],

    ...changes,
  } as ProductRow;
}

function renderUseProducts({
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
      useProducts({
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

  mocks.order.mockResolvedValue({
    data: [
      createProductRow(),
    ],
    error: null,
  });

  mocks.updateEq.mockResolvedValue({
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

describe("useProducts", () => {
  it("não consulta enquanto a autenticação está carregando", () => {
    renderUseProducts({
      authLoading: true,
    });

    expect(
      mocks.from
    ).not.toHaveBeenCalled();
  });

  it("não consulta sem função de usuário", () => {
    renderUseProducts({
      role: null,
    });

    expect(
      mocks.from
    ).not.toHaveBeenCalled();
  });

  it("carrega produtos para cliente autenticado", async () => {
    const {
      result,
    } = renderUseProducts({
      role: "client",
    });

    await waitFor(() => {
      expect(
        result.current.products
      ).toHaveLength(1);
    });

    expect(
      mocks.from
    ).toHaveBeenCalledWith(
      "products"
    );

    expect(
      mocks.order
    ).toHaveBeenCalledWith(
      "created_at",
      {
        ascending: false,
      }
    );
  });

  it("carrega produtos para administrador", async () => {
    const {
      result,
    } = renderUseProducts({
      role: "admin",
    });

    await waitFor(() => {
      expect(
        result.current.products
      ).toHaveLength(1);
    });
  });

  it("mapeia corretamente os dados do produto", async () => {
    const {
      result,
    } = renderUseProducts();

    await waitFor(() => {
      expect(
        result.current.products
      ).toHaveLength(1);
    });

    expect(
      result.current.products[0]
    ).toMatchObject({
      id: "product-1",
      name:
        "Bolo de Chocolate",
      category: "Bolos",
      description:
        "Bolo com recheio cremoso.",
      image: "/bolo.webp",
      stock: 10,
      lowStock: 2,
      active: true,
      archived: false,
      featured: true,
      featuredOrder: 1,
      customizable: true,

      options: [
        "Chocolate",
        "Morango",
      ],
    });
  });

  it("trata retorno sem produtos como lista vazia", async () => {
    mocks.order.mockResolvedValue({
      data: null,
      error: null,
    });

    const {
      result,
    } = renderUseProducts();

    await waitFor(() => {
      expect(
        mocks.order
      ).toHaveBeenCalledOnce();
    });

    expect(
      result.current.products
    ).toEqual([]);
  });

  it("mostra erro quando não consegue carregar produtos", async () => {
    const loadError = {
      message:
        "Falha ao consultar produtos",
    };

    mocks.order.mockResolvedValue({
      data: null,
      error: loadError,
    });

    const {
      result,
      setToast,
    } = renderUseProducts();

    await waitFor(() => {
      expect(
        setToast
      ).toHaveBeenCalledWith(
        "Não foi possível carregar os produtos."
      );
    });

    expect(
      result.current.products
    ).toEqual([]);
  });

  it("carrega depois que a autenticação termina", async () => {
    const {
      result,
      rerender,
    } = renderUseProducts({
      authLoading: true,
    });

    expect(
      mocks.from
    ).not.toHaveBeenCalled();

    rerender({
      currentAuthLoading: false,
      currentRole: "client",
    });

    await waitFor(() => {
      expect(
        result.current.products
      ).toHaveLength(1);
    });
  });

  it("atualiza o estoque no banco e no estado local", async () => {
    const {
      result,
      setToast,
    } = renderUseProducts();

    await waitFor(() => {
      expect(
        result.current.products
      ).toHaveLength(1);
    });

    await act(async () => {
      await result.current
        .handleStockChange(
          "product-1",
          7
        );
    });

    expect(
      mocks.update
    ).toHaveBeenCalledWith({
      stock_quantity: 7,
      updated_at:
        expect.any(String),
    });

    expect(
      mocks.updateEq
    ).toHaveBeenCalledWith(
      "id",
      "product-1"
    );

    expect(
      result.current.products[0]
        .stock
    ).toBe(7);

    expect(
      setToast
    ).toHaveBeenCalledWith(
      "Estoque atualizado!"
    );
  });

  it("arredonda o estoque para um número inteiro", async () => {
    const {
      result,
    } = renderUseProducts();

    await waitFor(() => {
      expect(
        result.current.products
      ).toHaveLength(1);
    });

    await act(async () => {
      await result.current
        .handleStockChange(
          "product-1",
          7.9
        );
    });

    expect(
      mocks.update
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        stock_quantity: 7,
      })
    );

    expect(
      result.current.products[0]
        .stock
    ).toBe(7);
  });

  it("impede estoque negativo", async () => {
    const {
      result,
    } = renderUseProducts();

    await waitFor(() => {
      expect(
        result.current.products
      ).toHaveLength(1);
    });

    await act(async () => {
      await result.current
        .handleStockChange(
          "product-1",
          -10
        );
    });

    expect(
      mocks.update
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        stock_quantity: 0,
      })
    );

    expect(
      result.current.products[0]
        .stock
    ).toBe(0);
  });

  it("mantém o estoque quando o banco retorna erro", async () => {
    mocks.updateEq.mockResolvedValue({
      error: {
        message:
          "Falha ao atualizar",
      },
    });

    const {
      result,
      setToast,
    } = renderUseProducts();

    await waitFor(() => {
      expect(
        result.current.products
      ).toHaveLength(1);
    });

    await act(async () => {
      await result.current
        .handleStockChange(
          "product-1",
          25
        );
    });

    expect(
      result.current.products[0]
        .stock
    ).toBe(10);

    expect(
      setToast
    ).toHaveBeenCalledWith(
      "Não foi possível atualizar o estoque."
    );
  });

  it("trata exceção inesperada ao atualizar estoque", async () => {
    mocks.updateEq.mockRejectedValue(
      new Error(
        "Sem conexão"
      )
    );

    const {
      result,
      setToast,
    } = renderUseProducts();

    await waitFor(() => {
      expect(
        result.current.products
      ).toHaveLength(1);
    });

    await act(async () => {
      await result.current
        .handleStockChange(
          "product-1",
          20
        );
    });

    expect(
      result.current.products[0]
        .stock
    ).toBe(10);

    expect(
      setToast
    ).toHaveBeenCalledWith(
      "Ocorreu um erro ao atualizar o estoque."
    );
  });

  it("permite substituir os produtos manualmente", async () => {
    const {
      result,
    } = renderUseProducts();

    await waitFor(() => {
      expect(
        result.current.products
      ).toHaveLength(1);
    });

    act(() => {
      result.current.setProducts(
        []
      );
    });

    expect(
      result.current.products
    ).toEqual([]);
  });
});