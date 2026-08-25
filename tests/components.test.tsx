// @vitest-environment jsdom

import {
  useState,
  type AnchorHTMLAttributes,
} from "react";

import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import userEvent from "@testing-library/user-event";

import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  Review,
} from "../app/components/client/review";

import type {
  ClientOrderRow,
  Product,
} from "../app/types";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...properties
  }: AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
  }) => (
    <a
      href={href}
      {...properties}
    >
      {children}
    </a>
  ),
}));

vi.mock(
  "../app/components/ui",
  () => ({
    ProductVisual: ({
      product,
    }: {
      product: Product;
    }) => (
      <div data-testid="product-visual">
        {product.name}
      </div>
    ),
  })
);

import {
  PublicProductCard,
} from "../app/components/public/public-product-card";

function createProduct(
  changes: Partial<Product> = {}
): Product {
  return {
    id: "product-1",
    name: "Bolo de Chocolate",
    category: "Bolos",
    price: "R$ 89,90",
    description:
      "Bolo de chocolate com recheio cremoso.",
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

describe("PublicProductCard", () => {
  it("exibe as informações principais do produto", () => {
    const product = createProduct();

    render(
      <PublicProductCard
        product={product}
      />
    );

    expect(
      screen.getByRole(
        "heading",
        {
          name: "Bolo de Chocolate",
        }
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText("Bolos")
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "Bolo de chocolate com recheio cremoso."
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText("R$ 89,90")
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /2 dias/
      )
    ).toBeInTheDocument();
  });

  it("renderiza a representação visual do produto", () => {
    const product = createProduct();

    render(
      <PublicProductCard
        product={product}
      />
    );

    expect(
      screen.getByTestId(
        "product-visual"
      )
    ).toHaveTextContent(
      "Bolo de Chocolate"
    );
  });

  it("mostra o aviso de imagem ilustrativa", () => {
    render(
      <PublicProductCard
        product={createProduct()}
      />
    );

    expect(
      screen.getByText(
        "Imagem meramente ilustrativa"
      )
    ).toBeInTheDocument();
  });

  it("mostra a etiqueta de destaque", () => {
    render(
      <PublicProductCard
        product={createProduct({
          featured: true,
        })}
      />
    );

    expect(
      screen.getByText("Destaque")
    ).toBeInTheDocument();
  });

  it("não mostra destaque em produto comum", () => {
    render(
      <PublicProductCard
        product={createProduct({
          featured: false,
        })}
      />
    );

    expect(
      screen.queryByText("Destaque")
    ).not.toBeInTheDocument();
  });

  it("mostra a etiqueta de produto personalizável", () => {
    render(
      <PublicProductCard
        product={createProduct({
          customizable: true,
        })}
      />
    );

    expect(
      screen.getByText(
        "Personalizável"
      )
    ).toBeInTheDocument();
  });

  it("não mostra personalizável em produto comum", () => {
    render(
      <PublicProductCard
        product={createProduct({
          customizable: false,
        })}
      />
    );

    expect(
      screen.queryByText(
        "Personalizável"
      )
    ).not.toBeInTheDocument();
  });

  it("mostra produto disponível quando há estoque", () => {
    const {
      container,
    } = render(
      <PublicProductCard
        product={createProduct({
          stock: 10,
        })}
      />
    );

    expect(
      screen.getByText("Disponível")
    ).toBeInTheDocument();

    expect(
      container.querySelector(
        ".public-product-card"
      )
    ).not.toHaveClass(
      "sold-out"
    );
  });

  it("usa o endereço padrão para encomendar", () => {
    render(
      <PublicProductCard
        product={createProduct()}
      />
    );

    const link =
      screen.getByRole("link", {
        name: "Encomendar",
      });

    expect(link).toHaveAttribute(
      "href",
      "/?entrar=1"
    );

    expect(link).toHaveAttribute(
      "aria-disabled",
      "false"
    );

    expect(link).not.toHaveClass(
      "disabled"
    );

    expect(link).not.toHaveAttribute(
      "tabindex"
    );
  });

  it("aceita um endereço personalizado para encomendar", () => {
    render(
      <PublicProductCard
        product={createProduct()}
        orderHref="/?access=client"
      />
    );

    expect(
      screen.getByRole("link", {
        name: "Encomendar",
      })
    ).toHaveAttribute(
      "href",
      "/?access=client"
    );
  });

  it("marca produto sem estoque como esgotado", () => {
    const {
      container,
    } = render(
      <PublicProductCard
        product={createProduct({
          stock: 0,
        })}
      />
    );

    expect(
      container.querySelector(
        ".public-product-card"
      )
    ).toHaveClass("sold-out");

    expect(
      screen.getByText(
        "Indisponível"
      )
    ).toHaveClass(
      "unavailable"
    );

    expect(
      screen.getByRole("link", {
        name: "Esgotado",
      })
    ).toBeInTheDocument();
  });

  it("desabilita a encomenda de produto esgotado", () => {
    render(
      <PublicProductCard
        product={createProduct({
          stock: 0,
        })}
      />
    );

    const link =
      screen.getByRole("link", {
        name: "Esgotado",
      });

    expect(link).toHaveClass(
      "disabled"
    );

    expect(link).toHaveAttribute(
      "aria-disabled",
      "true"
    );

    expect(link).toHaveAttribute(
      "tabindex",
      "-1"
    );
  });

  it("impede a navegação de produto esgotado", () => {
    render(
      <PublicProductCard
        product={createProduct({
          stock: 0,
        })}
      />
    );

    const link =
      screen.getByRole("link", {
        name: "Esgotado",
      });

    const clickEvent =
      new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
      });

    fireEvent(
      link,
      clickEvent
    );

    expect(
      clickEvent.defaultPrevented
    ).toBe(true);
  });

  it("renderiza destaque e personalização simultaneamente", () => {
    render(
      <PublicProductCard
        product={createProduct({
          featured: true,
          customizable: true,
        })}
      />
    );

    expect(
      screen.getByText("Destaque")
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "Personalizável"
      )
    ).toBeInTheDocument();
  });

  it("não quebra com descrição vazia", () => {
    const {
      container,
    } = render(
      <PublicProductCard
        product={createProduct({
          description: "",
        })}
      />
    );

    const description =
      container.querySelector(
        ".public-product-content > p"
      );

    expect(
      description
    ).toBeInTheDocument();

    expect(
      description
    ).toBeEmptyDOMElement();
  });
});

function createOrder(
  changes: Record<
    string,
    unknown
  > = {}
): ClientOrderRow {
  return {
    id: "order-1",
    order_number: 15,
    delivery_date: "2026-08-25",

    order_items: [
      {
        product_id: "product-1",
        product_name: "Cupcake",
        quantity: 2,
        products: [],
      },
    ],

    ...changes,
  } as unknown as ClientOrderRow;
}

function ReviewTest({
  orders = [
    createOrder(),
  ],
  loading = false,
  error = "",
  initialStars = 0,
  onSubmit = vi
    .fn()
    .mockResolvedValue(true),
}: {
  orders?: ClientOrderRow[];
  loading?: boolean;
  error?: string;
  initialStars?: number;

  onSubmit?: (
    orderId: string,
    comment: string
  ) => Promise<boolean>;
}) {
  const [
    stars,
    setStars,
  ] = useState(initialStars);

  return (
    <Review
      orders={orders}
      products={[
        createProduct({
          id: "product-1",
          name: "Cupcake",
          image: "/cupcake.webp",
        }),
      ]}
      stars={stars}
      setStars={setStars}
      loading={loading}
      error={error}
      onSubmit={onSubmit}
    />
  );
}

describe("Review", () => {
  it("mostra estado vazio sem pedidos disponíveis", () => {
    render(
      <ReviewTest orders={[]} />
    );

    expect(
      screen.getByRole("heading", {
        name:
          "Nenhum pedido para avaliar",
      })
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("form")
    ).not.toBeInTheDocument();
  });

  it("exibe as informações do pedido", () => {
    render(<ReviewTest />);

    expect(
      screen.getByText("PEDIDO #15")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "2× Cupcake",
      })
    ).toBeInTheDocument();

    const itemQuantity =
    screen.getByText("2", {
        selector:
        ".review-order-summary span:first-child b",
    });

    expect(
    itemQuantity.parentElement
    ).toHaveTextContent(
    /2\s*itens/
    );

    expect(
      screen.getByText(
        /Entregue em 25\/08\/2026/
      )
    ).toBeInTheDocument();
  });

  it("exibe a imagem correspondente ao produto", () => {
    render(<ReviewTest />);

    const image =
      screen.getByRole("img", {
        name: "2× Cupcake",
      });

    expect(image).toHaveAttribute(
      "src",
      "/cupcake.webp"
    );
  });

  it("exibe cinco botões de avaliação", () => {
    render(<ReviewTest />);

    expect(
      screen.getAllByRole(
        "button",
        {
          name: /estrelas?/i,
        }
      )
    ).toHaveLength(5);
  });

  it("permite selecionar uma avaliação", async () => {
    const user = userEvent.setup();

    render(<ReviewTest />);

    await user.click(
      screen.getByRole("button", {
        name: "4 estrelas",
      })
    );

    expect(
      screen.getByRole("button", {
        name: "4 estrelas",
      })
    ).toHaveAttribute(
      "aria-pressed",
      "true"
    );

    expect(
      screen.getByText(
        "Gostei muito"
      )
    ).toBeInTheDocument();
  });

  it("mostra a descrição ao passar o mouse nas estrelas", () => {
    render(<ReviewTest />);

    const fifthStar =
      screen.getByRole("button", {
        name: "5 estrelas",
      });

    fireEvent.mouseEnter(
      fifthStar
    );

    expect(
      screen.getByText(
        "Foi perfeito!"
      )
    ).toBeInTheDocument();

    fireEvent.mouseLeave(
      fifthStar.parentElement!
    );

    expect(
      screen.getByText(
        "Selecione de 1 a 5 estrelas"
      )
    ).toBeInTheDocument();
  });

  it("limita o comentário a 200 caracteres", async () => {
    const user = userEvent.setup();

    render(<ReviewTest />);

    const textarea =
      screen.getByRole(
        "textbox",
        {
          name: /Conte como foi/i,
        }
      );

    expect(textarea).toHaveAttribute(
      "maxlength",
      "200"
    );

    await user.type(
      textarea,
      "a".repeat(205)
    );

    expect(textarea).toHaveValue(
      "a".repeat(200)
    );

    expect(
      screen.getByText("200/200")
    ).toBeInTheDocument();
  });

  it("mostra inicialmente o contador correto", () => {
    render(<ReviewTest />);

    expect(
      screen.getByText("0/200")
    ).toBeInTheDocument();

    expect(
      screen.queryByText("0/2000")
    ).not.toBeInTheDocument();
  });

  it("mantém o envio desabilitado sem nota", async () => {
    const user = userEvent.setup();

    render(<ReviewTest />);

    await user.type(
      screen.getByRole(
        "textbox",
        {
          name: /Conte como foi/i,
        }
      ),
      "Muito bom"
    );

    expect(
      screen.getByRole("button", {
        name:
          /Enviar minha avaliação/i,
      })
    ).toBeDisabled();
  });

  it("mantém o envio desabilitado com comentário curto", async () => {
    const user = userEvent.setup();

    render(<ReviewTest />);

    await user.click(
      screen.getByRole("button", {
        name: "5 estrelas",
      })
    );

    await user.type(
      screen.getByRole(
        "textbox",
        {
          name: /Conte como foi/i,
        }
      ),
      "Ok"
    );

    expect(
      screen.getByRole("button", {
        name:
          /Enviar minha avaliação/i,
      })
    ).toBeDisabled();
  });

  it("envia o pedido e o comentário sem espaços externos", async () => {
    const user = userEvent.setup();

    const onSubmit = vi
      .fn()
      .mockResolvedValue(true);

    render(
      <ReviewTest
        onSubmit={onSubmit}
      />
    );

    await user.click(
      screen.getByRole("button", {
        name: "5 estrelas",
      })
    );

    await user.type(
      screen.getByRole(
        "textbox",
        {
          name: /Conte como foi/i,
        }
      ),
      "  Pedido excelente!  "
    );

    await user.click(
      screen.getByRole("button", {
        name:
          /Enviar minha avaliação/i,
      })
    );

    await waitFor(() => {
      expect(
        onSubmit
      ).toHaveBeenCalledWith(
        "order-1",
        "Pedido excelente!"
      );
    });
  });

  it("limpa o comentário depois do envio bem-sucedido", async () => {
    const user = userEvent.setup();

    render(<ReviewTest />);

    await user.click(
      screen.getByRole("button", {
        name: "5 estrelas",
      })
    );

    const textarea =
      screen.getByRole(
        "textbox",
        {
          name: /Conte como foi/i,
        }
      );

    await user.type(
      textarea,
      "Pedido excelente!"
    );

    await user.click(
      screen.getByRole("button", {
        name:
          /Enviar minha avaliação/i,
      })
    );

    await waitFor(() => {
      expect(
        textarea
      ).toHaveValue("");
    });
  });

  it("mantém o comentário quando o envio falha", async () => {
    const user = userEvent.setup();

    const onSubmit = vi
      .fn()
      .mockResolvedValue(false);

    render(
      <ReviewTest
        onSubmit={onSubmit}
      />
    );

    await user.click(
      screen.getByRole("button", {
        name: "5 estrelas",
      })
    );

    const textarea =
      screen.getByRole(
        "textbox",
        {
          name: /Conte como foi/i,
        }
      );

    await user.type(
      textarea,
      "Pedido excelente!"
    );

    await user.click(
      screen.getByRole("button", {
        name:
          /Enviar minha avaliação/i,
      })
    );

    await waitFor(() => {
      expect(
        onSubmit
      ).toHaveBeenCalledOnce();
    });

    expect(textarea).toHaveValue(
      "Pedido excelente!"
    );
  });

  it("mostra erro recebido pelo componente", () => {
    render(
      <ReviewTest
        error="Não foi possível enviar a avaliação."
      />
    );

    expect(
      screen.getByText(
        "Não foi possível enviar a avaliação."
      )
    ).toBeInTheDocument();
  });

  it("mostra o estado de carregamento", () => {
    render(
      <ReviewTest
        loading
        initialStars={5}
      />
    );

    const button =
      screen.getByRole("button", {
        name:
          "Enviando avaliação...",
      });

    expect(button).toBeDisabled();
  });

  it("permite escolher entre vários pedidos", async () => {
    const user = userEvent.setup();

    render(
      <ReviewTest
        orders={[
          createOrder(),
          createOrder({
            id: "order-2",
            order_number: 16,

            order_items: [
              {
                product_id:
                  "product-2",
                product_name:
                  "Bolo de Festa",
                quantity: 1,
                products: [],
              },
            ],
          }),
        ]}
      />
    );

    const selector =
      screen.getByRole(
        "combobox",
        {
          name:
            "Escolha o pedido",
        }
      );

    await user.selectOptions(
      selector,
      "order-2"
    );

    expect(
      screen.getByText(
        "PEDIDO #16"
      )
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "1× Bolo de Festa",
      })
    ).toBeInTheDocument();

    const itemQuantity =
    screen.getByText("1", {
        selector:
        ".review-order-summary span:first-child b",
    });

    expect(
    itemQuantity.parentElement
    ).toHaveTextContent(
    /1\s*item/
    );
  });
});