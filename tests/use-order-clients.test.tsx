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
  ClientProfileRow,
  Role,
} from "../app/types";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
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
  useOrderClients,
} from "../app/hooks/use-order-clients";

function createClient(
  changes: Partial<
    ClientProfileRow
  > = {}
): ClientProfileRow {
  return {
    id: "client-1",
    full_name:
      "Ana da Silva",
    phone: "21999999999",

    created_at:
      "2026-08-01T12:00:00.000Z",

    ...changes,
  };
}

function renderUseOrderClients({
  modalOpen = true,
  role = "admin",
  setToast = vi.fn(),
}: {
  modalOpen?: boolean;
  role?: Role | null;

  setToast?: ReturnType<
    typeof vi.fn
  >;
} = {}) {
  const hook = renderHook(
    (props: {
      currentModalOpen:
        boolean;

      currentRole:
        Role | null;
    }) =>
      useOrderClients({
        modalOpen:
          props.currentModalOpen,

        role:
          props.currentRole,

        setToast:
          setToast as unknown as Dispatch<
            SetStateAction<string>
          >,
      }),

    {
      initialProps: {
        currentModalOpen:
          modalOpen,

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
  mocks.eq.mockReset();
  mocks.order.mockReset();

  mocks.order.mockResolvedValue({
    data: [
      createClient(),

      createClient({
        id: "client-2",

        full_name:
          "Bruno Souza",

        phone: null,
      }),
    ],

    error: null,
  });

  mocks.from.mockReturnValue({
    select: mocks.select,
  });

  mocks.select.mockReturnValue({
    eq: mocks.eq,
  });

  mocks.eq.mockReturnValue({
    order: mocks.order,
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
  "useOrderClients - acesso",
  () => {
    it("não consulta com o modal fechado", () => {
      const {
        result,
      } = renderUseOrderClients({
        modalOpen: false,
      });

      expect(
        mocks.from
      ).not.toHaveBeenCalled();

      expect(
        result.current.orderClients
      ).toEqual([]);

      expect(
        result.current
          .orderClientsLoading
      ).toBe(false);
    });

    it("não consulta para usuário cliente", () => {
      renderUseOrderClients({
        role: "client",
      });

      expect(
        mocks.from
      ).not.toHaveBeenCalled();
    });

    it("não consulta sem usuário autenticado", () => {
      renderUseOrderClients({
        role: null,
      });

      expect(
        mocks.from
      ).not.toHaveBeenCalled();
    });

    it("consulta ao abrir o modal administrativo", async () => {
      const {
        result,
        rerender,
      } = renderUseOrderClients({
        modalOpen: false,
      });

      expect(
        mocks.from
      ).not.toHaveBeenCalled();

      rerender({
        currentModalOpen: true,
        currentRole: "admin",
      });

      await waitFor(() => {
        expect(
          result.current.orderClients
        ).toHaveLength(2);
      });

      expect(
        mocks.from
      ).toHaveBeenCalledOnce();
    });
  }
);

describe(
  "useOrderClients - carregamento",
  () => {
    it("carrega clientes em ordem alfabética", async () => {
      const {
        result,
      } = renderUseOrderClients();

      await waitFor(() => {
        expect(
          result.current.orderClients
        ).toHaveLength(2);
      });

      expect(
        mocks.from
      ).toHaveBeenCalledWith(
        "profiles"
      );

      expect(
        mocks.eq
      ).toHaveBeenCalledWith(
        "role",
        "client"
      );

      expect(
        mocks.order
      ).toHaveBeenCalledWith(
        "full_name",
        {
          ascending: true,
        }
      );

      expect(
        result.current.orderClients
      ).toEqual([
        createClient(),

        createClient({
          id: "client-2",

          full_name:
            "Bruno Souza",

          phone: null,
        }),
      ]);

      expect(
        result.current
          .orderClientsLoading
      ).toBe(false);
    });

    it("trata retorno nulo como lista vazia", async () => {
      mocks.order.mockResolvedValue({
        data: null,
        error: null,
      });

      const {
        result,
      } = renderUseOrderClients();

      await waitFor(() => {
        expect(
          mocks.order
        ).toHaveBeenCalledOnce();

        expect(
          result.current
            .orderClientsLoading
        ).toBe(false);
      });

      expect(
        result.current.orderClients
      ).toEqual([]);
    });

    it("mostra erro quando não consegue carregar", async () => {
      mocks.order.mockResolvedValue({
        data: null,

        error: {
          message:
            "Falha ao carregar clientes",
        },
      });

      const {
        result,
        setToast,
      } = renderUseOrderClients();

      await waitFor(() => {
        expect(
          result.current
            .orderClientsLoading
        ).toBe(false);

        expect(
          setToast
        ).toHaveBeenCalledWith(
          "Não foi possível carregar os clientes."
        );
      });

      expect(
        result.current.orderClients
      ).toEqual([]);

      expect(
        console.error
      ).toHaveBeenCalled();
    });

    it("indica quando os clientes estão sendo carregados", async () => {
      let resolveLoad:
        | ((value: {
            data:
              ClientProfileRow[];

            error: null;
          }) => void)
        | undefined;

      mocks.order.mockReturnValue(
        new Promise(resolve => {
          resolveLoad = resolve;
        })
      );

      const {
        result,
      } = renderUseOrderClients();

      expect(
        result.current
          .orderClientsLoading
      ).toBe(true);

      await act(async () => {
        resolveLoad?.({
          data: [
            createClient(),
          ],

          error: null,
        });
      });

      await waitFor(() => {
        expect(
          result.current
            .orderClientsLoading
        ).toBe(false);
      });

      expect(
        result.current.orderClients
      ).toHaveLength(1);
    });

    it("ignora o resultado depois que o hook é desmontado", async () => {
      let resolveLoad:
        | ((value: {
            data:
              ClientProfileRow[];

            error: null;
          }) => void)
        | undefined;

      mocks.order.mockReturnValue(
        new Promise(resolve => {
          resolveLoad = resolve;
        })
      );

      const {
        unmount,
      } = renderUseOrderClients();

      unmount();

      await act(async () => {
        resolveLoad?.({
          data: [
            createClient(),
          ],

          error: null,
        });
      });

      expect(
        console.error
      ).not.toHaveBeenCalled();
    });
  }
);