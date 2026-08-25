// @vitest-environment jsdom

import {
  act,
  renderHook,
  waitFor,
} from "@testing-library/react";

import type {
  Dispatch,
  SetStateAction,
} from "react";

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  UserProfile,
} from "../app/types";

type AuthSession = {
  user: {
    id: string;
    email?: string;
  };
} | null;

type AuthCallback = (
  event: string,
  session: AuthSession
) => void;

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChange: vi.fn(),
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  single: vi.fn(),
  unsubscribe: vi.fn(),

  authState: {
    callback:
      null as AuthCallback | null,
  },
}));

vi.mock(
  "../app/lib/supabase",
  () => ({
    supabase: {
      auth: {
        getSession:
          mocks.getSession,

        signOut:
          mocks.signOut,

        onAuthStateChange:
          mocks.onAuthStateChange,
      },

      from: mocks.from,
    },
  })
);

import {
  useAuth,
} from "../app/hooks/use-auth";

function createProfile(
  changes: Record<
    string,
    unknown
  > = {}
): UserProfile {
  return {
    full_name:
      "Luis Felipe Braido",
    role: "client",
    phone: "21999999999",
    birth_date: "2000-01-01",
    zip_code: "25940-000",
    street: "Rua Principal",
    address_number: "100",
    complement: "",
    district: "Centro",
    city: "Guapimirim",
    email:
      "cliente@exemplo.com",
    ...changes,
  } as unknown as UserProfile;
}

function renderUseAuth({
  setToast = vi.fn(),
  onLogoutSuccess = vi.fn(),
}: {
  setToast?: ReturnType<
    typeof vi.fn
  >;

  onLogoutSuccess?: ReturnType<
    typeof vi.fn
  >;
} = {}) {
  const result = renderHook(
    () =>
        useAuth({
        setToast:
            setToast as unknown as Dispatch<
            SetStateAction<string>
            >,

        onLogoutSuccess:
            onLogoutSuccess as unknown as
            () => void,
        })
  );

  return {
    ...result,
    setToast,
    onLogoutSuccess,
  };
}

beforeEach(() => {
  mocks.getSession.mockReset();
  mocks.signOut.mockReset();
  mocks.onAuthStateChange.mockReset();
  mocks.from.mockReset();
  mocks.select.mockReset();
  mocks.eq.mockReset();
  mocks.single.mockReset();
  mocks.unsubscribe.mockReset();

  mocks.authState.callback =
    null;

  mocks.getSession.mockResolvedValue({
    data: {
      session: null,
    },
    error: null,
  });

  mocks.signOut.mockResolvedValue({
    error: null,
  });

  mocks.single.mockResolvedValue({
    data: null,
    error: null,
  });

  mocks.eq.mockReturnValue({
    single: mocks.single,
  });

  mocks.select.mockReturnValue({
    eq: mocks.eq,
  });

  mocks.from.mockReturnValue({
    select: mocks.select,
  });

  mocks.onAuthStateChange.mockImplementation(
    (
      callback: AuthCallback
    ) => {
      mocks.authState.callback =
        callback;

      return {
        data: {
          subscription: {
            unsubscribe:
              mocks.unsubscribe,
          },
        },
      };
    }
  );

  vi.spyOn(
    console,
    "error"
  ).mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  sessionStorage.clear();
});

describe("useAuth", () => {
  it("finaliza o carregamento sem usuário autenticado", async () => {
    const {
      result,
    } = renderUseAuth();

    await waitFor(() => {
      expect(
        result.current.authLoading
      ).toBe(false);
    });

    expect(
      result.current.role
    ).toBeNull();

    expect(
      result.current.profile
    ).toBeNull();

    expect(
      mocks.from
    ).not.toHaveBeenCalled();
  });

  it("trata erro ao recuperar a sessão", async () => {
    mocks.getSession.mockResolvedValue({
      data: {
        session: null,
      },

      error: {
        message:
          "Não foi possível recuperar a sessão.",
      },
    });

    const {
      result,
    } = renderUseAuth();

    await waitFor(() => {
      expect(
        result.current.authLoading
      ).toBe(false);
    });

    expect(
      result.current.role
    ).toBeNull();

    expect(
      result.current.profile
    ).toBeNull();
  });

  it("restaura a sessão de um cliente", async () => {
    mocks.getSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: "user-1",
            email:
              "cliente@exemplo.com",
          },
        },
      },

      error: null,
    });

    mocks.single.mockResolvedValue({
      data: createProfile(),
      error: null,
    });

    const {
      result,
    } = renderUseAuth();

    await waitFor(() => {
      expect(
        result.current.role
      ).toBe("client");
    });

    expect(
      result.current.profile
    ).toMatchObject({
      full_name:
        "Luis Felipe Braido",
      role: "client",
      email:
        "cliente@exemplo.com",
    });

    expect(
      mocks.from
    ).toHaveBeenCalledWith(
      "profiles"
    );

    expect(
      mocks.eq
    ).toHaveBeenCalledWith(
      "id",
      "user-1"
    );
  });

  it("restaura a sessão de um administrador", async () => {
    mocks.getSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: "admin-1",
            email:
              "admin@fribolos.com",
          },
        },
      },

      error: null,
    });

    mocks.single.mockResolvedValue({
      data: createProfile({
        role: "admin",
      }),

      error: null,
    });

    const {
      result,
    } = renderUseAuth();

    await waitFor(() => {
      expect(
        result.current.role
      ).toBe("admin");
    });

    expect(
      result.current.profile
        ?.email
    ).toBe(
      "admin@fribolos.com"
    );
  });

  it("usa email vazio quando a sessão não possui email", async () => {
    mocks.getSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: "user-1",
          },
        },
      },

      error: null,
    });

    mocks.single.mockResolvedValue({
      data: createProfile(),
      error: null,
    });

    const {
      result,
    } = renderUseAuth();

    await waitFor(() => {
      expect(
        result.current.authLoading
      ).toBe(false);
    });

    expect(
      result.current.profile
        ?.email
    ).toBe("");
  });

  it("encerra a sessão quando não encontra o perfil", async () => {
    mocks.getSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: "user-1",
          },
        },
      },

      error: null,
    });

    mocks.single.mockResolvedValue({
      data: null,

      error: {
        message:
          "Perfil não encontrado",
      },
    });

    const {
      result,
    } = renderUseAuth();

    await waitFor(() => {
      expect(
        mocks.signOut
      ).toHaveBeenCalledOnce();
    });

    expect(
      result.current.role
    ).toBeNull();

    expect(
      result.current.profile
    ).toBeNull();
  });

  it("encerra sessão de perfil com função inválida", async () => {
    mocks.getSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: "user-1",
          },
        },
      },

      error: null,
    });

    mocks.single.mockResolvedValue({
      data: createProfile({
        role: "unknown",
      }),

      error: null,
    });

    const {
      result,
    } = renderUseAuth();

    await waitFor(() => {
      expect(
        mocks.signOut
      ).toHaveBeenCalledOnce();
    });

    expect(
      result.current.role
    ).toBeNull();
  });

  it("trata exceção ao restaurar a sessão", async () => {
    mocks.getSession.mockRejectedValue(
      new Error(
        "Sem conexão"
      )
    );

    const {
      result,
    } = renderUseAuth();

    await waitFor(() => {
      expect(
        result.current.authLoading
      ).toBe(false);
    });

    expect(
      result.current.role
    ).toBeNull();

    expect(
      result.current.profile
    ).toBeNull();
  });

  it("ativa o fluxo de recuperação de senha", async () => {
    const {
      result,
    } = renderUseAuth();

    await waitFor(() => {
      expect(
        result.current.authLoading
      ).toBe(false);
    });

    act(() => {
      mocks.authState.callback?.(
        "PASSWORD_RECOVERY",
        null
      );
    });

    expect(
      result.current.passwordRecovery
    ).toBe(true);

    expect(
      result.current.authLoading
    ).toBe(false);
  });

  it("remove usuário quando recebe sessão encerrada", async () => {
    const {
      result,
    } = renderUseAuth();

    await waitFor(() => {
      expect(
        result.current.authLoading
      ).toBe(false);
    });

    act(() => {
      result.current.handleLogin(
        createProfile()
      );
    });

    expect(
      result.current.role
    ).toBe("client");

    act(() => {
      mocks.authState.callback?.(
        "SIGNED_OUT",
        null
      );
    });

    expect(
      result.current.role
    ).toBeNull();

    expect(
      result.current.profile
    ).toBeNull();
  });

  it("define perfil e função depois do login", async () => {
    const {
      result,
    } = renderUseAuth();

    await waitFor(() => {
      expect(
        result.current.authLoading
      ).toBe(false);
    });

    const profile =
      createProfile({
        role: "admin",
      });

    act(() => {
      result.current.handleLogin(
        profile
      );
    });

    expect(
      result.current.role
    ).toBe("admin");

    expect(
      result.current.profile
    ).toBe(profile);
  });

  it("conclui a recuperação e limpa o usuário", async () => {
    const {
      result,
    } = renderUseAuth();

    await waitFor(() => {
      expect(
        result.current.authLoading
      ).toBe(false);
    });

    act(() => {
      mocks.authState.callback?.(
        "PASSWORD_RECOVERY",
        null
      );

      result.current.handleLogin(
        createProfile()
      );
    });

    act(() => {
      result.current
        .completePasswordRecovery();
    });

    expect(
      result.current.passwordRecovery
    ).toBe(false);

    expect(
      result.current.role
    ).toBeNull();

    expect(
      result.current.profile
    ).toBeNull();
  });

  it("faz logout e limpa os dados da sessão", async () => {
    const {
      result,
      onLogoutSuccess,
    } = renderUseAuth();

    await waitFor(() => {
      expect(
        result.current.authLoading
      ).toBe(false);
    });

    act(() => {
      result.current.handleLogin(
        createProfile()
      );
    });

    sessionStorage.setItem(
      "fribolos-client-section",
      "pedidos"
    );

    sessionStorage.setItem(
      "fribolos-admin-screen",
      "Pedidos"
    );

    await act(async () => {
      await result.current
        .handleLogout();
    });

    expect(
      mocks.signOut
    ).toHaveBeenCalledOnce();

    expect(
      sessionStorage.getItem(
        "fribolos-client-section"
      )
    ).toBeNull();

    expect(
      sessionStorage.getItem(
        "fribolos-admin-screen"
      )
    ).toBeNull();

    expect(
      result.current.role
    ).toBeNull();

    expect(
      result.current.profile
    ).toBeNull();

    expect(
      onLogoutSuccess
    ).toHaveBeenCalledOnce();
  });

  it("mantém o usuário quando o logout falha", async () => {
    mocks.signOut.mockResolvedValue({
      error: {
        message:
          "Falha ao sair",
      },
    });

    const {
      result,
      setToast,
      onLogoutSuccess,
    } = renderUseAuth();

    await waitFor(() => {
      expect(
        result.current.authLoading
      ).toBe(false);
    });

    act(() => {
      result.current.handleLogin(
        createProfile()
      );
    });

    await act(async () => {
      await result.current
        .handleLogout();
    });

    expect(
      result.current.role
    ).toBe("client");

    expect(
      setToast
    ).toHaveBeenCalledWith(
      "Não foi possível sair da conta. Tente novamente."
    );

    expect(
      onLogoutSuccess
    ).not.toHaveBeenCalled();
  });

  it("cancela a assinatura ao desmontar", () => {
    const {
      unmount,
    } = renderUseAuth();

    unmount();

    expect(
      mocks.unsubscribe
    ).toHaveBeenCalledOnce();
  });
});