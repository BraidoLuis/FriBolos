"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function AuthCallback() {
  const started = useRef(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    async function finishLogin() {
      try {
        const query = new URLSearchParams(window.location.search);
        const hash = new URLSearchParams(window.location.hash.slice(1));

        if (query.has("error") || hash.has("error")) {
          throw new Error("O login com Google foi cancelado ou recusado.");
        }

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          throw new Error("Não foi possível confirmar o login com Google.");
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profileError || !profile) {
          throw new Error(
            "A conta foi autenticada, mas seu perfil não foi encontrado."
          );
        }

        if (profile.role !== "client") {
          throw new Error(
            "Esta conta não possui acesso ao painel de clientes."
          );
        }

        window.location.replace("/");
      } catch (error) {
        await supabase.auth.signOut();
        setError(
          error instanceof Error
            ? error.message
            : "Não foi possível concluir o login."
        );
      }
    }

    void finishLogin();
  }, []);

  return (
    <main className="account-created">
      <section>
        <p className="eyebrow">FRIBOLOS</p>
        <h1>{error || "Concluindo seu login..."}</h1>
        {error && <a href="/?entrar=1">Voltar ao login</a>}
      </section>
    </main>
  );
}