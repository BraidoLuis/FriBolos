// @vitest-environment jsdom

import {
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  Product,
} from "../app/types";

vi.mock(
  "../app/components/ui",
  () => ({
    ProductVisual: ({
      product,
    }: {
      product: Product;
    }) => (
      <div
        data-testid="product-visual"
        data-product-id={product.id}
      >
        Imagem de {product.name}
      </div>
    ),
  })
);

import {
  ClientCatalog,
} from "../app/components/client/client-catalog";

function createProduct(
  changes: Partial<Product> = {}
): Product {
  return {
    id: "product-1",
    name: "Bolo de Chocolate",
    category: "Bolos",
    price: "R$ 50,00",

    description:
      "Bolo com recheio cremoso.",

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

function createProducts(): Product[] {
  return [
    createProduct({
      id: "bolo-festa",
      name: "Bolo de Festa",
      category: "Bolos",
      price: "R$ 120,00",

      description:
        "Bolo para celebrações.",

      featured: true,
      featuredOrder: 2,
      stock: 5,
      customizable: true,
    }),

    createProduct({
      id: "cupcake",
      name: "Cupcake de Limão",
      category: "Cupcakes",
      price: "R$ 8,50",

      description:
        "Cupcake cítrico e leve.",

      featured: true,
      featuredOrder: 1,
      stock: 20,
      customizable: false,
    }),

    createProduct({
      id: "brigadeiro",
      name: "Brigadeiro Gourmet",
      category: "Doces",
      price: "R$ 4,00",

      description:
        "Doce clássico brasileiro.",

      featured: false,
      stock: 30,
      customizable: false,
    }),

    createProduct({
      id: "torta",
      name: "Torta de Morango",
      category: "Tortas",
      price: "R$ 75,00",
      description: "",

      featured: false,
      stock: 0,
      customizable: true,
    }),
  ];
}

function productNames() {
  return Array.from(
    document.querySelectorAll(
      ".catalog-card h2"
    )
  ).map(element =>
    element.textContent?.trim()
  );
}

function renderCatalog(
  products = createProducts()
) {
  const onChoose = vi.fn();
  const onAdd = vi.fn();

  render(
    <ClientCatalog
      products={products}
      onChoose={
        onChoose as unknown as (
          product: Product
        ) => void
      }
      onAdd={
        onAdd as unknown as (
          product: Product
        ) => void
      }
    />
  );

  return {
    onChoose,
    onAdd,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe(
  "ClientCatalog - estrutura",
  () => {
    it("mostra o título e a quantidade total", () => {
    renderCatalog();

    expect(
        screen.getByRole(
        "heading",
        {
            level: 1,
            name:
            /Feitos à mão/i,
        }
        )
    ).toBeInTheDocument();

    const summaryItems =
        document.querySelectorAll(
        ".catalog-summary > span"
        );

    expect(
        summaryItems
    ).toHaveLength(2);

    expect(
        within(
        summaryItems[0] as HTMLElement
        ).getByText("4", {
        selector: "b",
        })
    ).toBeInTheDocument();

    expect(
        summaryItems[0]
    ).toHaveTextContent(
        "opções no cardápio"
    );
    });

    it("mostra apenas os produtos disponíveis no resumo", () => {
    renderCatalog();

    const summaryItems =
        document.querySelectorAll(
        ".catalog-summary > span"
        );

    expect(
        summaryItems
    ).toHaveLength(2);

    expect(
        within(
        summaryItems[1] as HTMLElement
        ).getByText("3", {
        selector: "b",
        })
    ).toBeInTheDocument();

    expect(
        summaryItems[1]
    ).toHaveTextContent(
        "disponíveis agora"
    );
    });

    it("cria as categorias em ordem alfabética com contadores", () => {
      renderCatalog();

      const filter =
        document.querySelector(
          ".catalog-filters"
        );

      expect(
        filter
      ).not.toBeNull();

      const buttons =
        Array.from(
          filter!.querySelectorAll(
            "button"
          )
        );

      expect(
        buttons.map(button =>
          button.querySelector(
            "span"
          )?.textContent?.trim()
        )
      ).toEqual([
        "Todos",
        "Bolos",
        "Cupcakes",
        "Doces",
        "Tortas",
      ]);

      expect(
        buttons.map(button =>
          button.querySelector(
            "b"
          )?.textContent?.trim()
        )
      ).toEqual([
        "4",
        "1",
        "1",
        "1",
        "1",
      ]);
    });
  }
);

describe(
  "ClientCatalog - busca e filtros",
  () => {
    it("filtra por categoria", () => {
      renderCatalog();

        const docesFilter =
        screen
            .getByText(
            "Doces",
            {
                selector:
                ".catalog-filters span",
            }
            )
            .closest("button");

        expect(
        docesFilter
        ).not.toBeNull();

        fireEvent.click(
        docesFilter as HTMLButtonElement
        );

      expect(
        productNames()
      ).toEqual([
        "Brigadeiro Gourmet",
      ]);

      expect(
        screen.getByRole(
          "heading",
          {
            name: "Doces",
          }
        )
      ).toBeInTheDocument();

      expect(
        screen.getByText(
          "1 produto encontrado"
        )
      ).toBeInTheDocument();
    });

    it("busca pelo nome do produto", () => {
      renderCatalog();

      fireEvent.change(
        screen.getByRole(
          "searchbox",
          {
            name:
              "Buscar produtos no catálogo",
          }
        ),
        {
          target: {
            value: "brigadeiro",
          },
        }
      );

      expect(
        productNames()
      ).toEqual([
        "Brigadeiro Gourmet",
      ]);
    });

    it("busca ignorando letras maiúsculas e acentos", () => {
      renderCatalog();

      fireEvent.change(
        screen.getByRole(
          "searchbox"
        ),
        {
          target: {
            value: "CITRICO",
          },
        }
      );

      expect(
        productNames()
      ).toEqual([
        "Cupcake de Limão",
      ]);
    });

    it("busca pela categoria", () => {
      renderCatalog();

      fireEvent.change(
        screen.getByRole(
          "searchbox"
        ),
        {
          target: {
            value: "tortas",
          },
        }
      );

      expect(
        productNames()
      ).toEqual([
        "Torta de Morango",
      ]);
    });

    it("limpa somente o texto pelo botão da busca", () => {
      renderCatalog();

      const search =
        screen.getByRole(
          "searchbox"
        );

      fireEvent.change(search, {
        target: {
          value: "brigadeiro",
        },
      });

      expect(
        productNames()
      ).toHaveLength(1);

      fireEvent.click(
        screen.getByRole(
          "button",
          {
            name: "Limpar busca",
          }
        )
      );

      expect(search).toHaveValue("");

      expect(
        productNames()
      ).toHaveLength(4);
    });

    it("limpa categoria, busca e ordenação", () => {
      renderCatalog();

      fireEvent.change(
        screen.getByRole(
          "combobox",
          {
            name:
              "Ordenar produtos",
          }
        ),
        {
          target: {
            value:
              "highest-price",
          },
        }
      );

        const bolosFilter =
        screen
            .getByText(
            "Bolos",
            {
                selector:
                ".catalog-filters span",
            }
            )
            .closest("button");

        expect(
        bolosFilter
        ).not.toBeNull();

        fireEvent.click(
        bolosFilter as HTMLButtonElement
        );

      fireEvent.click(
        screen.getByRole(
          "button",
          {
            name:
              "Limpar filtros",
          }
        )
      );

      expect(
        screen.getByRole(
          "searchbox"
        )
      ).toHaveValue("");

      expect(
        screen.getByRole(
          "combobox",
          {
            name:
              "Ordenar produtos",
          }
        )
      ).toHaveValue("featured");

      expect(
        productNames()
      ).toEqual([
        "Cupcake de Limão",
        "Bolo de Festa",
        "Brigadeiro Gourmet",
        "Torta de Morango",
      ]);
    });

    it("mostra o estado sem resultados", () => {
      renderCatalog();

      fireEvent.change(
        screen.getByRole(
          "searchbox"
        ),
        {
          target: {
            value:
              "produto inexistente",
          },
        }
      );

      expect(
        screen.getByRole(
          "heading",
          {
            name:
              "Não encontramos esse doce.",
          }
        )
      ).toBeInTheDocument();

      expect(
        productNames()
      ).toEqual([]);
    });

    it("volta ao catálogo pelo estado vazio", () => {
      renderCatalog();

      fireEvent.change(
        screen.getByRole(
          "searchbox"
        ),
        {
          target: {
            value:
              "produto inexistente",
          },
        }
      );

      fireEvent.click(
        screen.getByRole(
          "button",
          {
            name:
              "Ver todo o cardápio",
          }
        )
      );

      expect(
        productNames()
      ).toHaveLength(4);

      expect(
        screen.getByRole(
          "searchbox"
        )
      ).toHaveValue("");
    });
  }
);

describe(
  "ClientCatalog - ordenação",
  () => {
    it("prioriza destaques pela ordem definida", () => {
      renderCatalog();

      expect(
        productNames()
      ).toEqual([
        "Cupcake de Limão",
        "Bolo de Festa",
        "Brigadeiro Gourmet",
        "Torta de Morango",
      ]);
    });

    it("ordena pelo menor preço", () => {
      renderCatalog();

      fireEvent.change(
        screen.getByRole(
          "combobox",
          {
            name:
              "Ordenar produtos",
          }
        ),
        {
          target: {
            value:
              "lowest-price",
          },
        }
      );

      expect(
        productNames()
      ).toEqual([
        "Brigadeiro Gourmet",
        "Cupcake de Limão",
        "Torta de Morango",
        "Bolo de Festa",
      ]);
    });

    it("ordena pelo maior preço", () => {
      renderCatalog();

      fireEvent.change(
        screen.getByRole(
          "combobox",
          {
            name:
              "Ordenar produtos",
          }
        ),
        {
          target: {
            value:
              "highest-price",
          },
        }
      );

      expect(
        productNames()
      ).toEqual([
        "Bolo de Festa",
        "Torta de Morango",
        "Cupcake de Limão",
        "Brigadeiro Gourmet",
      ]);
    });

    it("ordena alfabeticamente", () => {
      renderCatalog();

      fireEvent.change(
        screen.getByRole(
          "combobox",
          {
            name:
              "Ordenar produtos",
          }
        ),
        {
          target: {
            value:
              "alphabetical",
          },
        }
      );

      expect(
        productNames()
      ).toEqual([
        "Bolo de Festa",
        "Brigadeiro Gourmet",
        "Cupcake de Limão",
        "Torta de Morango",
      ]);
    });
  }
);

describe(
  "ClientCatalog - cards",
  () => {
    it("mostra informações e descrição alternativa", () => {
      renderCatalog();

      expect(
        screen.getByText(
          "Bolo para celebrações."
        )
      ).toBeInTheDocument();

      expect(
        screen.getByText(
          "Uma opção preparada com todo o carinho da FriBolos."
        )
      ).toBeInTheDocument();

        expect(
        screen.getAllByText("2 dias")
        ).toHaveLength(4);

      expect(
        screen.getByText(
          "5 em estoque"
        )
      ).toBeInTheDocument();
    });

    it("mostra as etiquetas dos produtos", () => {
      renderCatalog();

      expect(
        screen.getAllByText(
          "★ Destaque"
        )
      ).toHaveLength(2);

      expect(
        screen.getAllByText(
          "Personalizável"
        )
      ).toHaveLength(2);

      expect(
        screen.getAllByText(
          "Imagem meramente ilustrativa"
        )
      ).toHaveLength(4);
    });

    it("desabilita as ações do produto esgotado", () => {
      renderCatalog();

      expect(
        screen.getByText(
          "Indisponível"
        )
      ).toBeInTheDocument();

      expect(
        screen.getByText(
          "Esgotado",
          {
            selector:
              ".catalog-meta b",
          }
        )
      ).toBeInTheDocument();

      const soldOutCard =
        screen
          .getByRole(
            "heading",
            {
              name:
                "Torta de Morango",
            }
          )
          .closest(
            ".catalog-card"
          );

      expect(
        soldOutCard
      ).not.toBeNull();

      const buttons =
        within(
          soldOutCard as HTMLElement
        ).getAllByRole("button");

      expect(
        buttons.every(
          button =>
            button.hasAttribute(
              "disabled"
            )
        )
      ).toBe(true);
    });

    it("adiciona produto ao carrinho", () => {
      const {
        onAdd,
      } = renderCatalog();

      fireEvent.click(
        screen.getAllByRole(
          "button",
          {
            name: /Carrinho/i,
          }
        )[0]
      );

      expect(
        onAdd
      ).toHaveBeenCalledOnce();

      expect(
        onAdd.mock.calls[0][0]
      ).toMatchObject({
        id: "cupcake",
        name:
          "Cupcake de Limão",
      });
    });

    it("abre a personalização", () => {
      const {
        onChoose,
      } = renderCatalog();

      const boloCard =
        screen
          .getByRole(
            "heading",
            {
              name:
                "Bolo de Festa",
            }
          )
          .closest(
            ".catalog-card"
          );

      fireEvent.click(
        within(
          boloCard as HTMLElement
        ).getByRole(
          "button",
          {
            name:
              "Personalizar",
          }
        )
      );

      expect(
        onChoose
      ).toHaveBeenCalledOnce();

      expect(
        onChoose.mock.calls[0][0]
      ).toMatchObject({
        id: "bolo-festa",
      });
    });

    it("não mostra personalização em produto comum", () => {
      renderCatalog();

      const cupcakeCard =
        screen
          .getByRole(
            "heading",
            {
              name:
                "Cupcake de Limão",
            }
          )
          .closest(
            ".catalog-card"
          );

      expect(
        within(
          cupcakeCard as HTMLElement
        ).queryByRole(
          "button",
          {
            name:
              "Personalizar",
          }
        )
      ).not.toBeInTheDocument();
    });

    it("mostra a dica quando há vários produtos", () => {
      renderCatalog();

      expect(
        screen.getByText(
          "Deslize para ver mais produtos"
        )
      ).toBeInTheDocument();
    });

    it("não mostra a dica quando existe somente um produto", () => {
      renderCatalog([
        createProduct(),
      ]);

      expect(
        screen.queryByText(
          "Deslize para ver mais produtos"
        )
      ).not.toBeInTheDocument();
    });
  }
);