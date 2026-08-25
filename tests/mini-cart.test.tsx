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
  CartItem,
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
  MiniCart,
} from "../app/components/client/mini-cart";

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

function createCartItem(
  changes: {
    product?: Partial<Product>;
    quantity?: number;
  } = {}
): CartItem {
  return {
    product: createProduct(
      changes.product
    ),

    quantity:
      changes.quantity ?? 2,
  };
}

function renderMiniCart(
  items: CartItem[] = [
    createCartItem(),
  ]
) {
  const onClose = vi.fn();
  const onQuantity = vi.fn();
  const onCheckout = vi.fn();
  const onCatalog = vi.fn();

  render(
    <MiniCart
      items={items}
      onClose={
        onClose as unknown as () => void
      }
      onQuantity={
        onQuantity as unknown as (
          id: Product["id"],
          delta: number
        ) => void
      }
      onCheckout={
        onCheckout as unknown as () => void
      }
      onCatalog={
        onCatalog as unknown as () => void
      }
    />
  );

  return {
    onClose,
    onQuantity,
    onCheckout,
    onCatalog,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe(
  "MiniCart - estrutura",
  () => {
    it("renderiza como diálogo modal", () => {
      renderMiniCart();

      const dialog =
        screen.getByRole(
          "dialog",
          {
            name: "Seu carrinho",
          }
        );

      expect(
        dialog
      ).toHaveAttribute(
        "aria-modal",
        "true"
      );

      expect(
        screen.getByRole(
          "heading",
          {
            name: "Carrinho",
          }
        )
      ).toBeInTheDocument();
    });

    it("renderiza um visual para cada produto", () => {
      renderMiniCart([
        createCartItem(),

        createCartItem({
          product: {
            id: "product-2",
            name: "Cupcake",
          },
        }),
      ]);

      expect(
        screen.getAllByTestId(
          "product-visual"
        )
      ).toHaveLength(2);
    });
  }
);

describe(
  "MiniCart - carrinho vazio",
  () => {
    it("mostra o estado vazio", () => {
      renderMiniCart([]);

      expect(
        screen.getByRole(
          "heading",
          {
            name:
              "Seu carrinho está vazio",
          }
        )
      ).toBeInTheDocument();

      expect(
        screen.getByText(
          /Escolha suas delícias/i
        )
      ).toBeInTheDocument();
    });

    it("permite abrir o catálogo", () => {
      const {
        onCatalog,
      } = renderMiniCart([]);

      fireEvent.click(
        screen.getByRole(
          "button",
          {
            name: "Ver catálogo",
          }
        )
      );

      expect(
        onCatalog
      ).toHaveBeenCalledOnce();
    });

    it("não mostra a finalização do pedido", () => {
      renderMiniCart([]);

      expect(
        screen.queryByRole(
          "button",
          {
            name:
              /Finalizar pedido/i,
          }
        )
      ).not.toBeInTheDocument();
    });
  }
);

describe(
  "MiniCart - produtos",
  () => {
    it("mostra as informações dos produtos", () => {
      renderMiniCart([
        createCartItem({
          quantity: 2,

          product: {
            name:
              "Bolo de Chocolate",

            category: "Bolos",
          },
        }),

        createCartItem({
          quantity: 3,

          product: {
            id: "product-2",
            name: "Cupcake",
            category: "Doces",
            price: "R$ 5,00",
          },
        }),
      ]);

      expect(
        screen.getByText(
          "Bolo de Chocolate"
        )
      ).toBeInTheDocument();

      expect(
        screen.getByText("Cupcake")
      ).toBeInTheDocument();

      expect(
        screen.getByText("Bolos")
      ).toBeInTheDocument();

      expect(
        screen.getByText("Doces")
      ).toBeInTheDocument();

      expect(
        screen.getByText("2")
      ).toBeInTheDocument();

      expect(
        screen.getByText("3")
      ).toBeInTheDocument();
    });

    it("calcula o valor de cada item pela quantidade", () => {
      renderMiniCart([
        createCartItem({
          quantity: 2,

          product: {
            price: "R$ 10,50",
          },
        }),

        createCartItem({
          quantity: 3,

          product: {
            id: "product-2",
            name: "Cupcake",
            price: "R$ 5,00",
          },
        }),
      ]);

      expect(
        screen.getByText(
          /21,00/
        )
      ).toBeInTheDocument();

      expect(
        screen.getByText(
          /15,00/
        )
      ).toBeInTheDocument();
    });

    it("calcula o subtotal do carrinho", () => {
      renderMiniCart([
        createCartItem({
          quantity: 2,

          product: {
            price: "R$ 10,50",
          },
        }),

        createCartItem({
          quantity: 3,

          product: {
            id: "product-2",
            name: "Cupcake",
            price: "R$ 5,00",
          },
        }),
      ]);

      const footer =
        screen
          .getByText("Subtotal")
          .closest("footer");

      expect(
        footer
      ).not.toBeNull();

      expect(
        within(footer!)
          .getByText(/36,00/)
      ).toBeInTheDocument();
    });

    it("solicita o aumento da quantidade", () => {
      const {
        onQuantity,
      } = renderMiniCart();

      fireEvent.click(
        screen.getByRole(
          "button",
          {
            name:
              "Aumentar Bolo de Chocolate",
          }
        )
      );

      expect(
        onQuantity
      ).toHaveBeenCalledWith(
        "product-1",
        1
      );
    });

    it("solicita a redução da quantidade", () => {
      const {
        onQuantity,
      } = renderMiniCart();

      fireEvent.click(
        screen.getByRole(
          "button",
          {
            name:
              "Diminuir Bolo de Chocolate",
          }
        )
      );

      expect(
        onQuantity
      ).toHaveBeenCalledWith(
        "product-1",
        -1
      );
    });

    it("remove toda a quantidade do produto", () => {
      const {
        onQuantity,
      } = renderMiniCart([
        createCartItem({
          quantity: 4,
        }),
      ]);

      fireEvent.click(
        screen.getByRole(
          "button",
          {
            name:
              "Remover Bolo de Chocolate",
          }
        )
      );

      expect(
        onQuantity
      ).toHaveBeenCalledWith(
        "product-1",
        -4
      );
    });
  }
);

describe(
  "MiniCart - ações",
  () => {
    it("inicia a finalização do pedido", () => {
      const {
        onCheckout,
      } = renderMiniCart();

      fireEvent.click(
        screen.getByRole(
          "button",
          {
            name:
              /Finalizar pedido/i,
          }
        )
      );

      expect(
        onCheckout
      ).toHaveBeenCalledOnce();
    });

    it("permite continuar comprando", () => {
      const {
        onCatalog,
      } = renderMiniCart();

      fireEvent.click(
        screen.getByRole(
          "button",
          {
            name:
              "Continuar comprando",
          }
        )
      );

      expect(
        onCatalog
      ).toHaveBeenCalledOnce();
    });

    it("fecha ao pressionar Escape", () => {
        const {
            onClose,
        } = renderMiniCart();

        fireEvent.keyDown(
            document,
            {
            key: "Escape",
            }
        );

        expect(
            onClose
        ).toHaveBeenCalledOnce();
        });

        it("não fecha ao pressionar outra tecla", () => {
        const {
            onClose,
        } = renderMiniCart();

        fireEvent.keyDown(
            document,
            {
            key: "Enter",
            }
        );

        expect(
            onClose
        ).not.toHaveBeenCalled();
    });

    it("fecha pelo botão", () => {
      const {
        onClose,
      } = renderMiniCart();

      fireEvent.click(
        screen.getByRole(
          "button",
          {
            name:
              "Fechar carrinho",
          }
        )
      );

      expect(
        onClose
      ).toHaveBeenCalledOnce();
    });

    it("fecha ao clicar diretamente no fundo", () => {
      const {
        onClose,
      } = renderMiniCart();

      const backdrop =
        document.querySelector(
          ".minicart-backdrop"
        );

      expect(
        backdrop
      ).not.toBeNull();

      fireEvent.mouseDown(
        backdrop!
      );

      expect(
        onClose
      ).toHaveBeenCalledOnce();
    });

    it("não fecha ao clicar dentro do carrinho", () => {
      const {
        onClose,
      } = renderMiniCart();

      fireEvent.mouseDown(
        screen.getByRole(
          "dialog",
          {
            name: "Seu carrinho",
          }
        )
      );

      expect(
        onClose
      ).not.toHaveBeenCalled();
    });
  }
);