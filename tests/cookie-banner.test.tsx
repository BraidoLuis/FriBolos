import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import {
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import {
  CookieBanner,
} from "../app/components/cookie-banner";

const STORAGE_KEY =
  "fribolos-storage-notice-v1";

describe("CookieBanner", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it(
    "mostra o aviso na primeira visita",
    async () => {
      render(<CookieBanner />);

      expect(
        await screen.findByRole(
          "complementary",
          {
            name:
              "Aviso de privacidade",
          }
        )
      ).toBeInTheDocument();
    }
  );

  it(
    "apresenta um link para a política",
    async () => {
      render(<CookieBanner />);

      const link =
        await screen.findByRole(
          "link",
          {
            name:
              /Política de Privacidade/i,
          }
        );

      expect(link).toHaveAttribute(
        "href",
        "/politica-de-privacidade"
      );
    }
  );

  it(
    "guarda a confirmação ao clicar em Entendi",
    async () => {
      render(<CookieBanner />);

      fireEvent.click(
        await screen.findByRole(
          "button",
          {
            name: "Entendi",
          }
        )
      );

      expect(
        window.localStorage.getItem(
          STORAGE_KEY
        )
      ).toBe("acknowledged");

      expect(
        screen.queryByRole(
          "complementary",
          {
            name:
              "Aviso de privacidade",
          }
        )
      ).not.toBeInTheDocument();
    }
  );

  it(
    "não reaparece depois da confirmação",
    async () => {
      window.localStorage.setItem(
        STORAGE_KEY,
        "acknowledged"
      );

      render(<CookieBanner />);

      await waitFor(() => {
        expect(
          screen.queryByRole(
            "complementary",
            {
              name:
                "Aviso de privacidade",
            }
          )
        ).not.toBeInTheDocument();
      });
    }
  );
});