// @vitest-environment node

import {
  describe,
  expect,
  it,
} from "vitest";

import {
  passwordValidationError,
} from "../app/lib/validator";

describe("passwordValidationError", () => {
  it("aceita uma senha válida", () => {
    expect(
      passwordValidationError("Senha123")
    ).toBeNull();
  });

  it("aceita uma senha válida com símbolos", () => {
    expect(
      passwordValidationError(
        "MinhaSenha@123"
      )
    ).toBeNull();
  });

  it("aceita uma senha com exatamente 8 caracteres", () => {
    expect(
      passwordValidationError("Abcdef1!")
    ).toBeNull();
  });

  it("aceita uma senha com exatamente 72 caracteres", () => {
    const password =
      "Aa1" + "b".repeat(69);

    expect(password).toHaveLength(72);

    expect(
      passwordValidationError(password)
    ).toBeNull();
  });

  it("rejeita uma senha vazia", () => {
    expect(
      passwordValidationError("")
    ).toBe(
      "A senha deve possuir entre 8 e 72 caracteres."
    );
  });

  it("rejeita uma senha com menos de 8 caracteres", () => {
    expect(
      passwordValidationError("Abcd123")
    ).toBe(
      "A senha deve possuir entre 8 e 72 caracteres."
    );
  });

  it("rejeita uma senha com mais de 72 caracteres", () => {
    const password =
      "Aa1" + "b".repeat(70);

    expect(password).toHaveLength(73);

    expect(
      passwordValidationError(password)
    ).toBe(
      "A senha deve possuir entre 8 e 72 caracteres."
    );
  });

  it("rejeita espaços no meio da senha", () => {
    expect(
      passwordValidationError(
        "Senha 123"
      )
    ).toBe(
      "A senha não pode conter espaços."
    );
  });

  it("rejeita espaço no início", () => {
    expect(
      passwordValidationError(
        " Senha123"
      )
    ).toBe(
      "A senha não pode conter espaços."
    );
  });

  it("rejeita espaço no final", () => {
    expect(
      passwordValidationError(
        "Senha123 "
      )
    ).toBe(
      "A senha não pode conter espaços."
    );
  });

  it("rejeita tabulação", () => {
    expect(
      passwordValidationError(
        "Senha\t123"
      )
    ).toBe(
      "A senha não pode conter espaços."
    );
  });

  it("rejeita senha sem letra minúscula", () => {
    expect(
      passwordValidationError(
        "SENHA123"
      )
    ).toBe(
      "A senha deve possuir pelo menos uma letra minúscula."
    );
  });

  it("rejeita senha sem letra maiúscula", () => {
    expect(
      passwordValidationError(
        "senha123"
      )
    ).toBe(
      "A senha deve possuir pelo menos uma letra maiúscula."
    );
  });

  it("rejeita senha sem número", () => {
    expect(
      passwordValidationError(
        "SenhaForte"
      )
    ).toBe(
      "A senha deve possuir pelo menos um número."
    );
  });

  it("não considera símbolos como números", () => {
    expect(
      passwordValidationError(
        "Senha@Forte"
      )
    ).toBe(
      "A senha deve possuir pelo menos um número."
    );
  });

  it("aceita zeros como números", () => {
    expect(
      passwordValidationError(
        "Senha000"
      )
    ).toBeNull();
  });

  it.each([
    "Senha123",
    "OutraSenha9",
    "Teste@2026",
    "Fribolos1",
    "Segura#45",
  ])(
    "aceita a senha válida %s",
    password => {
      expect(
        passwordValidationError(
          password
        )
      ).toBeNull();
    }
  );

  it.each([
    "",
    "a",
    "Ab1",
    "Teste1",
    "1234567",
  ])(
    "rejeita a senha curta %s",
    password => {
      expect(
        passwordValidationError(
          password
        )
      ).not.toBeNull();
    }
  );
});