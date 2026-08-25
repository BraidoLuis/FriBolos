"use client";

import {
  useState,
  type FormEvent,
} from "react";

import { supabase } from "../../lib/supabase";

import {
  passwordValidationError,
} from "../../lib/validator";

export function ResetPassword({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirmation,
    setShowConfirmation,
  ] = useState(false);

  async function updatePassword(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    const formData = new FormData(
      e.currentTarget
    );

    const password = String(
      formData.get("password") || ""
    );

    const confirmation = String(
      formData.get("confirmation") || ""
    );

    setError("");

    const passwordError =
      passwordValidationError(password);

    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmation) {
      setError(
        "As senhas não coincidem."
      );
      return;
    }

    setLoading(true);

    

    try {
      const {
        error: updateError,
      } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        console.error(
          "Erro ao atualizar senha:",
          updateError
        );

        setError(
          updateError.message ||
            "Não foi possível atualizar a senha."
        );

        return;
      }

      await supabase.auth.signOut();
      onComplete();
    } catch (unexpectedError) {
      console.error(
        "Erro inesperado ao atualizar senha:",
        unexpectedError
      );

      setError(
        "Ocorreu um erro ao atualizar sua senha."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-area">
        <form
          className="login-card"
          onSubmit={updatePassword}
        >
          <div className="mobile-brand">
            <span>♨</span>

            <strong>
              Fri<em>Bolos</em>
            </strong>
          </div>

          <p className="eyebrow">
            RECUPERAÇÃO DE SENHA
          </p>

          <h2>Crie uma nova senha</h2>

          <p className="login-subtitle">
            Informe e confirme sua nova senha.
          </p>

          <label className="login-label">
            Nova senha

            <div className="login-input">
              <span>⌑</span>

              <input
                required
                minLength={8}
                maxLength={72}
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                name="password"
                placeholder="Crie uma senha segura"
                autoComplete="new-password"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    currentValue =>
                      !currentValue
                  )
                }
                aria-label={
                  showPassword
                    ? "Ocultar nova senha"
                    : "Mostrar nova senha"
                }
                title={
                  showPassword
                    ? "Ocultar senha"
                    : "Mostrar senha"
                }
              >
                {showPassword ? "Ocultar" : "Exibir"}
              </button>
            </div>

            <small>
              Use de 8 a 72 caracteres, com letra
              maiúscula, minúscula e número.
            </small>
          </label>

          <label className="login-label">
            Confirmar nova senha

            <div className="login-input">
              <span>⌑</span>

              <input
                required
                minLength={8}
                maxLength={72}
                type={
                  showConfirmation
                    ? "text"
                    : "password"
                }
                name="confirmation"
                placeholder="Repita sua nova senha"
                autoComplete="new-password"
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmation(
                    currentValue =>
                      !currentValue
                  )
                }
                aria-label={
                  showConfirmation
                    ? "Ocultar confirmação da senha"
                    : "Mostrar confirmação da senha"
                }
                title={
                  showConfirmation
                    ? "Ocultar senha"
                    : "Mostrar senha"
                }
              >
                {showConfirmation
                  ? "Ocultar"
                  : "Exibir"}
              </button>
            </div>
          </label>

          {error && (
            <p className="form-error">
              {error}
            </p>
          )}

          <button
            className="login-submit"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Atualizando senha..."
              : "Salvar nova senha"}

            <span>→</span>
          </button>
        </form>
      </section>
    </main>
  );
}