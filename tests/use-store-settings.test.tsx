// @vitest-environment jsdom

import type {
  Dispatch,
  FormEvent,
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
  Role,
  StoreSettings,
} from "../app/types";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),

  loadSelect: vi.fn(),
  loadEq: vi.fn(),
  loadSingle: vi.fn(),

  update: vi.fn(),
  updateEq: vi.fn(),
  updateSelect: vi.fn(),
  updateSingle: vi.fn(),
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
  useStoreSettings,
} from "../app/hooks/use-store-settings";

function createStoreSettings(
  changes: Partial<
    StoreSettings
  > = {}
): StoreSettings {
  return {
    id: 1,
    store_name: "FriBolos",

    description:
      "Encomendas feitas com carinho.",

    cnpj: null,

    contact_email:
      "contato@fribolos.com.br",

    whatsapp: "21999999999",
    instagram: "@fribolos",

    address:
      "Rua Principal, 100",

    city: "Guapimirim",
    state: "RJ",
    zip_code: "25940-000",

    opening_time: "08:00",
    closing_time: "18:00",

    business_days:
      "Seg, Ter, Qua, Qui, Sex",

    business_weekdays: [
      1,
      2,
      3,
      4,
      5,
    ],

    minimum_order_value: 50,
    delivery_fee: 10,
    accepts_orders: true,

    created_at:
      "2026-08-01T12:00:00.000Z",

    updated_at:
      "2026-08-25T12:00:00.000Z",

    ...changes,
  };
}

function renderUseStoreSettings({
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
    (props: {
      currentAuthLoading:
        boolean;

      currentRole:
        Role | null;
    }) =>
      useStoreSettings({
        authLoading:
          props.currentAuthLoading,

        role:
          props.currentRole,

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

type FormField = {
  name: string;
  value?: string;
  checked?: boolean;
};

function createSubmitEvent(
  changes: FormField[] = []
) {
  const form =
    document.createElement("form");

  const defaultFields:
    FormField[] = [
      {
        name: "storeName",
        value: "  FriBolos  ",
      },
      {
        name: "description",
        value:
          "  Encomendas especiais  ",
      },
      {
        name: "cnpj",
        value: "12.345.678/0001-90",
      },
      {
        name: "contactEmail",
        value:
          "  contato@fribolos.com.br  ",
      },
      {
        name: "whatsapp",
        value: "  21999999999  ",
      },
      {
        name: "instagram",
        value: "  @fribolos  ",
      },
      {
        name: "address",
        value:
          "  Rua Principal, 100  ",
      },
      {
        name: "city",
        value: "  Guapimirim  ",
      },
      {
        name: "state",
        value: "  RJ  ",
      },
      {
        name: "zipCode",
        value: "  25940-000  ",
      },
      {
        name: "openingTime",
        value: "08:00",
      },
      {
        name: "closingTime",
        value: "18:00",
      },
      {
        name:
          "minimumOrderValue",
        value: "50,50",
      },
      {
        name: "deliveryFee",
        value: "10,25",
      },
      {
        name:
          "businessWeekdays",
        value: "1",
        checked: true,
      },
      {
        name:
          "businessWeekdays",
        value: "3",
        checked: true,
      },
      {
        name:
          "businessWeekdays",
        value: "6",
        checked: true,
      },
      {
        name: "acceptsOrders",
        value: "on",
        checked: true,
      },
    ];

  const changedNames =
    new Set(
      changes.map(
        field => field.name
      )
    );

  const fields = [
    ...defaultFields.filter(
      field =>
        !changedNames.has(
          field.name
        )
    ),

    ...changes,
  ];

  for (const field of fields) {
    const input =
      document.createElement(
        "input"
      );

    input.name = field.name;
    input.value =
      field.value || "";

    if (
      field.name ===
        "businessWeekdays" ||
      field.name ===
        "acceptsOrders"
    ) {
      input.type = "checkbox";

      input.checked =
        field.checked ?? false;
    }

    form.appendChild(input);
  }

  const preventDefault =
    vi.fn();

  const event = {
    preventDefault,

    currentTarget: form,
  } as unknown as FormEvent<HTMLFormElement>;

  return {
    event,
    preventDefault,
  };
}

beforeEach(() => {
  mocks.from.mockReset();

  mocks.loadSelect.mockReset();
  mocks.loadEq.mockReset();
  mocks.loadSingle.mockReset();

  mocks.update.mockReset();
  mocks.updateEq.mockReset();
  mocks.updateSelect.mockReset();
  mocks.updateSingle.mockReset();

  mocks.loadSingle.mockResolvedValue({
    data: createStoreSettings(),
    error: null,
  });

  mocks.updateSingle.mockResolvedValue({
    data: createStoreSettings({
      minimum_order_value:
        50.5,

      delivery_fee: 10.25,

      business_days:
        "Seg, Qua, Sáb",

      business_weekdays: [
        1,
        3,
        6,
      ],
    }),

    error: null,
  });

  mocks.loadSelect.mockReturnValue({
    eq: mocks.loadEq,
  });

  mocks.loadEq.mockReturnValue({
    single:
      mocks.loadSingle,
  });

  mocks.update.mockReturnValue({
    eq: mocks.updateEq,
  });

  mocks.updateEq.mockReturnValue({
    select:
      mocks.updateSelect,
  });

  mocks.updateSelect.mockReturnValue({
    single:
      mocks.updateSingle,
  });

  mocks.from.mockReturnValue({
    select:
      mocks.loadSelect,

    update:
      mocks.update,
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
  "useStoreSettings - carregamento",
  () => {
    it("não consulta enquanto a autenticação carrega", () => {
      renderUseStoreSettings({
        authLoading: true,
      });

      expect(
        mocks.from
      ).not.toHaveBeenCalled();
    });

    it("não consulta sem usuário autenticado", () => {
      renderUseStoreSettings({
        role: null,
      });

      expect(
        mocks.from
      ).not.toHaveBeenCalled();
    });

    it("carrega as configurações para o administrador", async () => {
      const {
        result,
      } = renderUseStoreSettings();

      await waitFor(() => {
        expect(
          result.current.storeSettings
        ).not.toBeNull();
      });

      expect(
        mocks.from
      ).toHaveBeenCalledWith(
        "store_settings"
      );

      expect(
        mocks.loadEq
      ).toHaveBeenCalledWith(
        "id",
        1
      );

      expect(
        mocks.loadSingle
      ).toHaveBeenCalledOnce();

      expect(
        result.current.storeSettings
      ).toMatchObject({
        id: 1,
        store_name: "FriBolos",
        city: "Guapimirim",
        state: "RJ",

        minimum_order_value: 50,
        delivery_fee: 10,
        accepts_orders: true,
      });

      expect(
        result.current
          .storeSettingsLoading
      ).toBe(false);
    });

    it("também carrega as configurações para o cliente", async () => {
      const {
        result,
      } = renderUseStoreSettings({
        role: "client",
      });

      await waitFor(() => {
        expect(
          result.current.storeSettings
        ).not.toBeNull();
      });

      expect(
        mocks.from
      ).toHaveBeenCalledWith(
        "store_settings"
      );
    });

    it("trata erro no carregamento", async () => {
      mocks.loadSingle.mockResolvedValue({
        data: null,

        error: {
          message:
            "Falha ao carregar",
        },
      });

      const {
        result,
        setToast,
      } = renderUseStoreSettings();

      await waitFor(() => {
        expect(
          result.current
            .storeSettingsLoading
        ).toBe(false);
      });

      expect(
        result.current.storeSettings
      ).toBeNull();

      expect(
        setToast
      ).toHaveBeenCalledWith(
        "Não foi possível carregar as configurações."
      );

      expect(
        console.error
      ).toHaveBeenCalled();
    });

    it("mantém o carregamento ativo enquanto a consulta está pendente", async () => {
      let resolveLoad:
        | ((value: {
            data: StoreSettings;
            error: null;
          }) => void)
        | undefined;

      mocks.loadSingle.mockReturnValue(
        new Promise(resolve => {
          resolveLoad = resolve;
        })
      );

      const {
        result,
      } = renderUseStoreSettings();

      expect(
        result.current
          .storeSettingsLoading
      ).toBe(true);

      await act(async () => {
        resolveLoad?.({
          data:
            createStoreSettings(),

          error: null,
        });
      });

      await waitFor(() => {
        expect(
          result.current
            .storeSettingsLoading
        ).toBe(false);
      });
    });

    it("ignora o resultado depois que o hook é desmontado", async () => {
      let resolveLoad:
        | ((value: {
            data: StoreSettings;
            error: null;
          }) => void)
        | undefined;

      mocks.loadSingle.mockReturnValue(
        new Promise(resolve => {
          resolveLoad = resolve;
        })
      );

      const {
        unmount,
      } = renderUseStoreSettings();

      unmount();

      await act(async () => {
        resolveLoad?.({
          data:
            createStoreSettings(),

          error: null,
        });
      });

      expect(
        console.error
      ).not.toHaveBeenCalled();
    });
  }
);

describe(
  "useStoreSettings - salvamento",
  () => {
    it("impede o envio sem dias de funcionamento", async () => {
      const {
        result,
        setToast,
      } = renderUseStoreSettings();

      await waitFor(() => {
        expect(
          result.current.storeSettings
        ).not.toBeNull();
      });

      const {
        event,
        preventDefault,
      } = createSubmitEvent([
        {
          name:
            "businessWeekdays",

          value: "1",
          checked: false,
        },
      ]);

      await act(async () => {
        await result.current
          .saveStoreSettings(event);
      });

      expect(
        preventDefault
      ).toHaveBeenCalledOnce();

      expect(
        mocks.update
      ).not.toHaveBeenCalled();

      expect(
        setToast
      ).toHaveBeenCalledWith(
        "Selecione pelo menos um dia de funcionamento."
      );
    });

    it("ignora dias de funcionamento inválidos", async () => {
      const {
        result,
      } = renderUseStoreSettings();

      await waitFor(() => {
        expect(
          result.current.storeSettings
        ).not.toBeNull();
      });

      const {
        event,
      } = createSubmitEvent([
        {
          name:
            "businessWeekdays",
          value: "1",
          checked: true,
        },
        {
          name:
            "businessWeekdays",
          value: "7",
          checked: true,
        },
        {
          name:
            "businessWeekdays",
          value: "-1",
          checked: true,
        },
        {
          name:
            "businessWeekdays",
          value: "abc",
          checked: true,
        },
      ]);

      await act(async () => {
        await result.current
          .saveStoreSettings(event);
      });

      expect(
        mocks.update
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          business_days: "Seg",

          business_weekdays: [
            1,
          ],
        })
      );
    });

    it("normaliza e salva todos os campos", async () => {
      const {
        result,
        setToast,
      } = renderUseStoreSettings();

      await waitFor(() => {
        expect(
          result.current.storeSettings
        ).not.toBeNull();
      });

      const {
        event,
      } = createSubmitEvent();

      await act(async () => {
        await result.current
          .saveStoreSettings(event);
      });

      expect(
        mocks.update
      ).toHaveBeenCalledWith({
        store_name: "FriBolos",

        description:
          "Encomendas especiais",

        cnpj:
          "12.345.678/0001-90",

        contact_email:
          "contato@fribolos.com.br",

        whatsapp:
          "21999999999",

        instagram:
          "@fribolos",

        address:
          "Rua Principal, 100",

        city: "Guapimirim",
        state: "RJ",

        zip_code:
          "25940-000",

        opening_time: "08:00",
        closing_time: "18:00",

        business_days:
          "Seg, Qua, Sáb",

        business_weekdays: [
          1,
          3,
          6,
        ],

        minimum_order_value:
          50.5,

        delivery_fee: 10.25,

        accepts_orders: true,

        updated_at:
          expect.any(String),
      });

      expect(
        mocks.updateEq
      ).toHaveBeenCalledWith(
        "id",
        1
      );

      expect(
        mocks.updateSelect
      ).toHaveBeenCalledOnce();

      expect(
        mocks.updateSingle
      ).toHaveBeenCalledOnce();

      expect(
        setToast
      ).toHaveBeenCalledWith(
        "Configurações salvas com sucesso!"
      );
    });

    it("converte campos opcionais vazios para null", async () => {
      const {
        result,
      } = renderUseStoreSettings();

      await waitFor(() => {
        expect(
          result.current.storeSettings
        ).not.toBeNull();
      });

      const optionalFields = [
        "description",
        "cnpj",
        "contactEmail",
        "whatsapp",
        "instagram",
        "address",
        "city",
        "state",
        "zipCode",
        "openingTime",
        "closingTime",
      ].map(name => ({
        name,
        value: "   ",
      }));

      const {
        event,
      } = createSubmitEvent(
        optionalFields
      );

      await act(async () => {
        await result.current
          .saveStoreSettings(event);
      });

      expect(
        mocks.update
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          description: null,
          cnpj: null,
          contact_email: null,
          whatsapp: null,
          instagram: null,
          address: null,
          city: null,
          state: null,
          zip_code: null,
        })
      );
    });

    it("salva valores inválidos como zero", async () => {
      const {
        result,
      } = renderUseStoreSettings();

      await waitFor(() => {
        expect(
          result.current.storeSettings
        ).not.toBeNull();
      });

      const {
        event,
      } = createSubmitEvent([
        {
          name:
            "minimumOrderValue",

          value:
            "valor inválido",
        },
        {
          name: "deliveryFee",
          value: "inválido",
        },
      ]);

      await act(async () => {
        await result.current
          .saveStoreSettings(event);
      });

      expect(
        mocks.update
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          minimum_order_value: 0,
          delivery_fee: 0,
        })
      );
    });

    it("salva accepts_orders como false quando desmarcado", async () => {
      const {
        result,
      } = renderUseStoreSettings();

      await waitFor(() => {
        expect(
          result.current.storeSettings
        ).not.toBeNull();
      });

      const {
        event,
      } = createSubmitEvent([
        {
          name:
            "acceptsOrders",

          value: "on",
          checked: false,
        },
      ]);

      await act(async () => {
        await result.current
          .saveStoreSettings(event);
      });

      expect(
        mocks.update
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          accepts_orders: false,
        })
      );
    });

    it("atualiza o estado com os dados retornados pelo banco", async () => {
      const savedSettings =
        createStoreSettings({
          store_name:
            "FriBolos Atualizada",

          minimum_order_value:
            75,

          delivery_fee: 15,
        });

      mocks.updateSingle.mockResolvedValue({
        data: savedSettings,
        error: null,
      });

      const {
        result,
      } = renderUseStoreSettings();

      await waitFor(() => {
        expect(
          result.current.storeSettings
        ).not.toBeNull();
      });

      const {
        event,
      } = createSubmitEvent();

      await act(async () => {
        await result.current
          .saveStoreSettings(event);
      });

      expect(
        result.current.storeSettings
      ).toEqual(savedSettings);
    });

    it("mantém os dados anteriores quando o banco retorna erro", async () => {
      mocks.updateSingle.mockResolvedValue({
        data: null,

        error: {
          message:
            "Falha ao salvar",
        },
      });

      const {
        result,
        setToast,
      } = renderUseStoreSettings();

      await waitFor(() => {
        expect(
          result.current.storeSettings
        ).not.toBeNull();
      });

      const previousSettings =
        result.current.storeSettings;

      const {
        event,
      } = createSubmitEvent();

      await act(async () => {
        await result.current
          .saveStoreSettings(event);
      });

      expect(
        result.current.storeSettings
      ).toEqual(
        previousSettings
      );

      expect(
        setToast
      ).toHaveBeenCalledWith(
        "Não foi possível salvar as configurações."
      );

      expect(
        result.current
          .savingStoreSettings
      ).toBe(false);
    });

    it("trata uma exceção inesperada", async () => {
      mocks.updateSingle.mockRejectedValue(
        new Error("Sem conexão")
      );

      const {
        result,
        setToast,
      } = renderUseStoreSettings();

      await waitFor(() => {
        expect(
          result.current.storeSettings
        ).not.toBeNull();
      });

      const {
        event,
      } = createSubmitEvent();

      await act(async () => {
        await result.current
          .saveStoreSettings(event);
      });

      expect(
        setToast
      ).toHaveBeenCalledWith(
        "Ocorreu um erro ao salvar as configurações."
      );

      expect(
        result.current
          .savingStoreSettings
      ).toBe(false);

      expect(
        console.error
      ).toHaveBeenCalled();
    });

    it("indica quando as configurações estão sendo salvas", async () => {
      let resolveSave:
        | ((value: {
            data: StoreSettings;
            error: null;
          }) => void)
        | undefined;

      mocks.updateSingle.mockReturnValue(
        new Promise(resolve => {
          resolveSave = resolve;
        })
      );

      const {
        result,
      } = renderUseStoreSettings();

      await waitFor(() => {
        expect(
          result.current.storeSettings
        ).not.toBeNull();
      });

      const {
        event,
      } = createSubmitEvent();

      let savePromise:
        Promise<void>;

      act(() => {
        savePromise =
          result.current
            .saveStoreSettings(event);
      });

      expect(
        result.current
          .savingStoreSettings
      ).toBe(true);

      await act(async () => {
        resolveSave?.({
          data:
            createStoreSettings(),

          error: null,
        });

        await savePromise!;
      });

      expect(
        result.current
          .savingStoreSettings
      ).toBe(false);
    });
  }
);