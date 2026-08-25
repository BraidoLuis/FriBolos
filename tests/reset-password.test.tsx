// @vitest-environment jsdom

import {
  fireEvent,
  render,
  screen,
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

const {
  updateUserMock,
  signOutMock,
} = vi.hoisted(() => ({
  updateUserMock: vi.fn(),
  signOutMock: vi.fn(),
}));

vi.mock(
  "../app/lib/supabase",
  () => ({
    supabase: {
      auth: {
        updateUser:
          updateUserMock,

        signOut: signOutMock,
      },
    },
  })
);

import {
  ResetPassword,
} from "../app/components/auth/reset-password";

function renderResetPassword(
  onComplete = vi.fn()
) {
  const result = render(
    <ResetPassword
      onComplete={onComplete}
    />
  );

  const password =
    screen.getByPlaceholderText(
      "Crie uma senha segura"
    );

  const confirmation =
    screen.getByPlaceholderText(
      "Repita sua nova senha"
    );

  const form =
    result.container.querySelector(
      "form"
    )!;

  return {
    ...result,
    password,
    confirmation,
    form,
    onComplete,
  };
}

function fillPasswords(
  password: string,
  confirmation = password
) {
  fireEvent.change(
    screen.getByPlaceholderText(
      "Crie uma senha segura"
    ),
    {
      target: {
        value: password,
      },
    }
  );

  fireEvent.change(
    screen.getByPlaceholderText(
      "Repita sua nova senha"
    ),
    {
      target: {
        value: confirmation,
      },
    }
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ResetPassword", () => {
  beforeEach(() => {
    updateUserMock.mockReset();
    signOutMock.mockReset();

    signOutMock.mockResolvedValue({
      error: null,
    });

    vi.spyOn(
      console,
      "error"
    ).mockImplementation(() => {});
  });

  it("renderiza os campos de nova senha", () => {
    const {
      password,
      confirmation,
    } = renderResetPassword();

    expect(password).toHaveAttribute(
      "name",
      "password"
    );

    expect(
      confirmation
    ).toHaveAttribute(
      "name",
      "confirmation"
    );

    expect(password).toBeRequired();

    expect(
      confirmation
    ).toBeRequired();
  });

  it("aplica os limites de 8 e 72 caracteres", () => {
    const {
      password,
      confirmation,
    } = renderResetPassword();

    expect(password).toHaveAttribute(
      "minlength",
      "8"
    );

    expect(password).toHaveAttribute(
      "maxlength",
      "72"
    );

    expect(
      confirmation
    ).toHaveAttribute(
      "minlength",
      "8"
    );

    expect(
      confirmation
    ).toHaveAttribute(
      "maxlength",
      "72"
    );
  });

  it("inicia com as senhas ocultas", () => {
    const {
      password,
      confirmation,
    } = renderResetPassword();

    expect(password).toHaveAttribute(
      "type",
      "password"
    );

    expect(
      confirmation
    ).toHaveAttribute(
      "type",
      "password"
    );
  });

  it("mostra e oculta a nova senha", () => {
    const {
      password,
    } = renderResetPassword();

    fireEvent.click(
      screen.getByRole("button", {
        name:
          "Mostrar nova senha",
      })
    );

    expect(password).toHaveAttribute(
      "type",
      "text"
    );

    fireEvent.click(
      screen.getByRole("button", {
        name:
          "Ocultar nova senha",
      })
    );

    expect(password).toHaveAttribute(
      "type",
      "password"
    );
  });

  it("mostra e oculta a confirmação independentemente", () => {
    const {
      password,
      confirmation,
    } = renderResetPassword();

    fireEvent.click(
      screen.getByRole("button", {
        name:
          "Mostrar confirmação da senha",
      })
    );

    expect(
      confirmation
    ).toHaveAttribute(
      "type",
      "text"
    );

    expect(password).toHaveAttribute(
      "type",
      "password"
    );

    fireEvent.click(
      screen.getByRole("button", {
        name:
          "Ocultar confirmação da senha",
      })
    );

    expect(
      confirmation
    ).toHaveAttribute(
      "type",
      "password"
    );
  });

  it("rejeita senha fraca sem chamar o Supabase", () => {
    const {
      form,
    } = renderResetPassword();

    fillPasswords("teste123");

    fireEvent.submit(form);

    expect(
      screen.getByText(
        "A senha deve possuir pelo menos uma letra maiúscula."
      )
    ).toBeInTheDocument();

    expect(
      updateUserMock
    ).not.toHaveBeenCalled();
  });

  it("rejeita senhas diferentes", () => {
    const {
      form,
    } = renderResetPassword();

    fillPasswords(
      "Senha123",
      "OutraSenha9"
    );

    fireEvent.submit(form);

    expect(
      screen.getByText(
        "As senhas não coincidem."
      )
    ).toBeInTheDocument();

    expect(
      updateUserMock
    ).not.toHaveBeenCalled();
  });

  it("atualiza a senha válida no Supabase", async () => {
    updateUserMock.mockResolvedValue({
      error: null,
    });

    const {
      form,
    } = renderResetPassword();

    fillPasswords("Senha123");

    fireEvent.submit(form);

    await waitFor(() => {
      expect(
        updateUserMock
      ).toHaveBeenCalledWith({
        password: "Senha123",
      });
    });
  });

  it("encerra a sessão e conclui a recuperação após sucesso", async () => {
    updateUserMock.mockResolvedValue({
      error: null,
    });

    const onComplete = vi.fn();

    const {
      form,
    } = renderResetPassword(
      onComplete
    );

    fillPasswords("Senha123");

    fireEvent.submit(form);

    await waitFor(() => {
      expect(
        signOutMock
      ).toHaveBeenCalledOnce();

      expect(
        onComplete
      ).toHaveBeenCalledOnce();
    });
  });

  it("mostra o erro retornado pelo Supabase", async () => {
    updateUserMock.mockResolvedValue({
      error: {
        message:
          "Sessão de recuperação expirada.",
      },
    });

    const onComplete = vi.fn();

    const {
      form,
    } = renderResetPassword(
      onComplete
    );

    fillPasswords("Senha123");

    fireEvent.submit(form);

    expect(
      await screen.findByText(
        "Sessão de recuperação expirada."
      )
    ).toBeInTheDocument();

    expect(
      signOutMock
    ).not.toHaveBeenCalled();

    expect(
      onComplete
    ).not.toHaveBeenCalled();
  });

  it("usa uma mensagem alternativa quando o erro não possui texto", async () => {
    updateUserMock.mockResolvedValue({
      error: {
        message: "",
      },
    });

    const {
      form,
    } = renderResetPassword();

    fillPasswords("Senha123");

    fireEvent.submit(form);

    expect(
      await screen.findByText(
        "Não foi possível atualizar a senha."
      )
    ).toBeInTheDocument();
  });

  it("trata exceção inesperada", async () => {
    updateUserMock.mockRejectedValue(
      new Error(
        "Supabase indisponível"
      )
    );

    const {
      form,
    } = renderResetPassword();

    fillPasswords("Senha123");

    fireEvent.submit(form);

    expect(
      await screen.findByText(
        "Ocorreu um erro ao atualizar sua senha."
      )
    ).toBeInTheDocument();
  });

  it("mostra o estado de carregamento durante a atualização", async () => {
    updateUserMock.mockReturnValue(
      new Promise(() => {})
    );

    const {
      form,
    } = renderResetPassword();

    fillPasswords("Senha123");

    fireEvent.submit(form);

    const button =
      await screen.findByRole(
        "button",
        {
          name:
            /Atualizando senha/i,
        }
      );

    expect(button).toBeDisabled();
  });

  it("volta ao estado normal depois de um erro", async () => {
    updateUserMock.mockResolvedValue({
      error: {
        message:
          "Não foi possível atualizar.",
      },
    });

    const {
      form,
    } = renderResetPassword();

    fillPasswords("Senha123");

    fireEvent.submit(form);

    await screen.findByText(
      "Não foi possível atualizar."
    );

    expect(
      screen.getByRole("button", {
        name:
          /Salvar nova senha/i,
      })
    ).not.toBeDisabled();
  });

  it("não conclui quando o logout lança uma exceção", async () => {
    updateUserMock.mockResolvedValue({
      error: null,
    });

    signOutMock.mockRejectedValue(
      new Error(
        "Erro ao encerrar sessão"
      )
    );

    const onComplete = vi.fn();

    const {
      form,
    } = renderResetPassword(
      onComplete
    );

    fillPasswords("Senha123");

    fireEvent.submit(form);

    expect(
      await screen.findByText(
        "Ocorreu um erro ao atualizar sua senha."
      )
    ).toBeInTheDocument();

    expect(
      onComplete
    ).not.toHaveBeenCalled();
  });
});