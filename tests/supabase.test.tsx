// @vitest-environment jsdom

import {
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import userEvent from "@testing-library/user-event";

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const {
  rpcMock,
} = vi.hoisted(() => ({
  rpcMock: vi.fn(),
}));

vi.mock(
  "../app/lib/supabase",
  () => ({
    supabase: {
      rpc: rpcMock,
    },
  })
);

import {
  LoginReviewsCarousel,
} from "../app/components/auth/login-reviews-carousel";

const publicReviews = [
  {
    rating: 5,
    comment:
      "Bolo excelente e entrega perfeita!",
    created_at:
      "2026-08-20T12:00:00.000Z",
  },
  {
    rating: 4,
    comment:
      "Gostei muito da encomenda.",
    created_at:
      "2026-08-19T12:00:00.000Z",
  },
  {
    rating: 3,
    comment:
      "Foi uma boa experiência.",
    created_at:
      "2026-08-18T12:00:00.000Z",
  },
];

describe(
  "LoginReviewsCarousel com Supabase",
  () => {
    beforeEach(() => {
      vi.restoreAllMocks();
      rpcMock.mockReset();
    });

    it("chama a função pública de avaliações com limite de seis", async () => {
      rpcMock.mockResolvedValue({
        data: [
          publicReviews[0],
        ],
        error: null,
      });

      render(
        <LoginReviewsCarousel />
      );

      await waitFor(() => {
        expect(
          rpcMock
        ).toHaveBeenCalledWith(
          "get_public_reviews",
          {
            p_limit: 6,
          }
        );
      });
    });

    it("não exibe o carrossel enquanto estiver carregando", () => {
      rpcMock.mockReturnValue(
        new Promise(() => {})
      );

      render(
        <LoginReviewsCarousel />
      );

      expect(
        screen.queryByRole(
          "region",
          {
            name:
              "Avaliações de clientes",
          }
        )
      ).not.toBeInTheDocument();
    });

    it("exibe uma avaliação retornada pelo Supabase", async () => {
      rpcMock.mockResolvedValue({
        data: [
          publicReviews[0],
        ],
        error: null,
      });

      render(
        <LoginReviewsCarousel />
      );

      expect(
        await screen.findByText(
          "“Bolo excelente e entrega perfeita!”"
        )
      ).toBeInTheDocument();

      expect(
        screen.getByLabelText(
          "5 de 5 estrelas"
        )
      ).toBeInTheDocument();
    });

    it("marca a quantidade correta de estrelas preenchidas", async () => {
      rpcMock.mockResolvedValue({
        data: [
          {
            ...publicReviews[0],
            rating: 4,
          },
        ],
        error: null,
      });

      const {
        container,
      } = render(
        <LoginReviewsCarousel />
      );

      await screen.findByLabelText(
        "4 de 5 estrelas"
      );

      expect(
        container.querySelectorAll(
          ".login-review-stars .filled"
        )
      ).toHaveLength(4);

      expect(
        container.querySelectorAll(
          ".login-review-stars span"
        )
      ).toHaveLength(5);
    });

    it("não mostra controles quando há somente uma avaliação", async () => {
      rpcMock.mockResolvedValue({
        data: [
          publicReviews[0],
        ],
        error: null,
      });

      render(
        <LoginReviewsCarousel />
      );

      await screen.findByText(
        "“Bolo excelente e entrega perfeita!”"
      );

      expect(
        screen.queryByRole(
          "button",
          {
            name:
              "Próxima avaliação",
          }
        )
      ).not.toBeInTheDocument();

      expect(
        screen.queryByRole(
          "button",
          {
            name:
              "Avaliação anterior",
          }
        )
      ).not.toBeInTheDocument();
    });

    it("avança para a próxima avaliação", async () => {
      const user = userEvent.setup();

      rpcMock.mockResolvedValue({
        data: publicReviews,
        error: null,
      });

      render(
        <LoginReviewsCarousel />
      );

      await screen.findByText(
        "“Bolo excelente e entrega perfeita!”"
      );

      await user.click(
        screen.getByRole(
          "button",
          {
            name:
              "Próxima avaliação",
          }
        )
      );

      expect(
        screen.getByText(
          "“Gostei muito da encomenda.”"
        )
      ).toBeInTheDocument();

      expect(
        screen.getByLabelText(
          "4 de 5 estrelas"
        )
      ).toBeInTheDocument();
    });

    it("volta da primeira para a última avaliação", async () => {
      const user = userEvent.setup();

      rpcMock.mockResolvedValue({
        data: publicReviews,
        error: null,
      });

      render(
        <LoginReviewsCarousel />
      );

      await screen.findByText(
        "“Bolo excelente e entrega perfeita!”"
      );

      await user.click(
        screen.getByRole(
          "button",
          {
            name:
              "Avaliação anterior",
          }
        )
      );

      expect(
        screen.getByText(
          "“Foi uma boa experiência.”"
        )
      ).toBeInTheDocument();

      expect(
        screen.getByLabelText(
          "3 de 5 estrelas"
        )
      ).toBeInTheDocument();
    });

    it("permite escolher uma avaliação pelo indicador", async () => {
      const user = userEvent.setup();

      rpcMock.mockResolvedValue({
        data: publicReviews,
        error: null,
      });

      render(
        <LoginReviewsCarousel />
      );

      await screen.findByText(
        "“Bolo excelente e entrega perfeita!”"
      );

      await user.click(
        screen.getByRole(
          "button",
          {
            name:
              "Ver avaliação 3",
          }
        )
      );

      expect(
        screen.getByText(
          "“Foi uma boa experiência.”"
        )
      ).toBeInTheDocument();

      expect(
        screen.getByRole(
          "button",
          {
            name:
              "Ver avaliação 3",
          }
        )
      ).toHaveClass("active");
    });

    it("não renderiza nada quando não existem avaliações", async () => {
      rpcMock.mockResolvedValue({
        data: [],
        error: null,
      });

      render(
        <LoginReviewsCarousel />
      );

      await waitFor(() => {
        expect(
          rpcMock
        ).toHaveBeenCalledOnce();
      });

      expect(
        screen.queryByRole(
          "region",
          {
            name:
              "Avaliações de clientes",
          }
        )
      ).not.toBeInTheDocument();
    });

    it("trata retorno nulo como lista vazia", async () => {
      rpcMock.mockResolvedValue({
        data: null,
        error: null,
      });

      render(
        <LoginReviewsCarousel />
      );

      await waitFor(() => {
        expect(
          rpcMock
        ).toHaveBeenCalledOnce();
      });

      expect(
        screen.queryByRole(
          "region",
          {
            name:
              "Avaliações de clientes",
          }
        )
      ).not.toBeInTheDocument();
    });

    it("trata erro do Supabase sem quebrar a tela", async () => {
      const consoleError =
        vi.spyOn(
          console,
          "error"
        ).mockImplementation(
          () => {}
        );

      const supabaseError = {
        message:
          "Sem permissão para acessar avaliações",
      };

      rpcMock.mockResolvedValue({
        data: null,
        error: supabaseError,
      });

      render(
        <LoginReviewsCarousel />
      );

      await waitFor(() => {
        expect(
          consoleError
        ).toHaveBeenCalledWith(
          "Erro ao carregar avaliações públicas:",
          supabaseError
        );
      });

      expect(
        screen.queryByRole(
          "region",
          {
            name:
              "Avaliações de clientes",
          }
        )
      ).not.toBeInTheDocument();
    });

    it("exibe identificação anônima sem dados pessoais", async () => {
      rpcMock.mockResolvedValue({
        data: [
          {
            ...publicReviews[0],

            customer_name:
              "Nome que não deve aparecer",

            email:
              "cliente@exemplo.com",
          },
        ],
        error: null,
      });

      render(
        <LoginReviewsCarousel />
      );

      await screen.findByText(
        "“Bolo excelente e entrega perfeita!”"
      );

      expect(
        screen.getByText(
          "Cliente FriBolos"
        )
      ).toBeInTheDocument();

      expect(
        screen.getByText(
          "Compra verificada"
        )
      ).toBeInTheDocument();

      expect(
        screen.queryByText(
          "Nome que não deve aparecer"
        )
      ).not.toBeInTheDocument();

      expect(
        screen.queryByText(
          "cliente@exemplo.com"
        )
      ).not.toBeInTheDocument();
    });
  }
);