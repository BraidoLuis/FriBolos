"use client";

import {
  useState,
  type FormEvent,
} from "react";

import { supabase } from "../../lib/supabase";

export function ResetPassword({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

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

    if (password.length < 6) {
      setError(
        "A senha deve possuir pelo menos 6 caracteres."
      );
      return;
    }

    if (password !== confirmation) {
      setError(
        "As senhas informadas não coincidem."
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
                minLength={6}
                type="password"
                name="password"
                placeholder="Mínimo de 6 caracteres"
                autoComplete="new-password"
              />
            </div>
          </label>

          <label className="login-label">
            Confirmar nova senha

            <div className="login-input">
              <span>⌑</span>

              <input
                required
                minLength={6}
                type="password"
                name="confirmation"
                placeholder="Repita sua nova senha"
                autoComplete="new-password"
              />
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