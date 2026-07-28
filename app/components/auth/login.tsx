"use client";

import {
  useState,
  type FormEvent,
} from "react";

import { supabase } from "../../lib/supabase";

import {
  ThemeToggle,
} from "../theme-toggle";

import type {
  Role,
  UserProfile,
} from "../../types";

export function Login({
  onLogin,
}: {
  onLogin: (profile: UserProfile) => void;
}) {
  const isAdminAccess =
    typeof window !== "undefined" &&
    new URLSearchParams(
      window.location.search
    ).get("access") === "admin";

  const [role, setRole] =
  useState<Role>(
    isAdminAccess
      ? "admin"
      : "client"
  );
  const [showPassword, setShowPassword] =
    useState(false);
  const [signup, setSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [loginEmail, setLoginEmail] =
    useState("");

  const [resetLoading, setResetLoading] =
    useState(false);

  const [resetSent, setResetSent] =
    useState(false);

  const isClient =
    role === "client";

  const loginContent = isClient
    ? {
        eyebrow:
          "ENCOMENDAS FEITAS COM CARINHO",

        title: (
          <>
            Momentos especiais
            <br />
            começam com um doce.
          </>
        ),

        description:
          "Explore nosso catálogo, personalize sua encomenda e acompanhe cada etapa do seu pedido.",

        highlights: [
          {
            icon: "♡",
            title: "Feito para você",
            text: "Personalize sua encomenda",
          },
          {
            icon: "♨",
            title: "Sempre fresquinho",
            text: "Produção feita com carinho",
          },
          {
            icon: "✓",
            title: "Acompanhe tudo",
            text: "Do pedido até a entrega",
          },
        ],
      }
    : {
        eyebrow:
          "GESTÃO FEITA COM CARINHO",

        title: (
          <>
            Mais tempo para criar.
            <br />
            Mais controle para crescer.
          </>
        ),

        description:
          "Organize pedidos, produção e clientes em um só lugar — com a delicadeza que sua confeitaria merece.",

        highlights: [],
      };

  async function handleLogin(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = e.currentTarget;
    const data = new FormData(form);

    const email = String(data.get("email") || "")
      .trim()
      .toLowerCase();

    const password = String(
      data.get("password") || ""
    );

    if (!email || !password) {
      setError("Informe o e-mail e a senha.");
      setLoading(false);
      return;
    }

    try {
      const {
        data: authData,
        error: authError,
      } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error(
          "Erro de autenticação:",
          authError
        );

        const message =
          authError.message.toLowerCase();

        if (message.includes("email not confirmed")) {
          setError(
            "Confirme seu e-mail antes de entrar."
          );
          return;
        }

        if (
          message.includes("invalid login credentials")
        ) {
          setError("E-mail ou senha incorretos.");
          return;
        }

        setError(authError.message);
        return;
      }

      if (!authData.user) {
        setError(
          "Não foi possível identificar o usuário."
        );
        return;
      }

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select(`
          full_name,
          role,
          phone,
          birth_date,
          zip_code,
          street,
          address_number,
          complement,
          district,
          city
        `)
        .eq("id", authData.user.id)
        .single();

      if (profileError || !profile) {
        console.error(
          "Erro ao carregar perfil:",
          profileError
        );

        await supabase.auth.signOut();

        setError(
          "Não foi possível carregar o perfil da conta."
        );
        return;
      }

      const profileRole = profile.role as Role;

      if (
        profileRole !== "admin" &&
        profileRole !== "client"
      ) {
        await supabase.auth.signOut();

        setError(
          "O tipo desta conta não é válido."
        );
        return;
      }

      if (profileRole !== role) {
        await supabase.auth.signOut();

        setError(
          profileRole === "client"
            ? "Conta não encontrada, tente novamente."
            : "Conta não encontrada, tente novamente."
        );

        return;
      }

      onLogin({
        ...profile,
        role: profileRole,
        email: authData.user.email || "",
      });

    } catch (connectionError) {
      console.error(
        "Erro de conexão no login:",
        connectionError
      );

      setError(
        "Não foi possível conectar ao servidor. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  }

  if (signup) {
    return (
      <Signup
        onBack={() => {
          setSignup(false);
          setRole("client");
          setError("");
        }}
      />
    );
  }

  async function sendPasswordRecovery() {
    setError("");
    setResetSent(false);

    if (!loginEmail.trim()) {
      setError(
        "Informe seu e-mail para recuperar a senha."
      );
      return;
    }

    setResetLoading(true);

    try {
      const {
        error: resetError,
      } =
        await supabase.auth.resetPasswordForEmail(
          loginEmail.trim().toLowerCase(),
          {
            redirectTo:
              `${window.location.origin}/`,
          }
        );

      if (resetError) {
        console.error(
          "Erro ao enviar recuperação:",
          resetError
        );

        setError(
          resetError.message ||
            "Não foi possível enviar o e-mail."
        );
        return;
      }

      setResetSent(true);
    } catch (unexpectedError) {
      console.error(
        "Erro inesperado na recuperação:",
        unexpectedError
      );

      setError(
        "Ocorreu um erro ao enviar o e-mail."
      );
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <main
      className={`login-page login-page-${role}`}
    >
      <div className="login-theme-toggle">
        <ThemeToggle />
      </div>

      <section className="login-showcase">
        <div className="login-brand">
          <span>♨</span>

          <strong>
            Fri<em>Bolos</em>
          </strong>
        </div>

        <div
          className="login-copy"
          key={role}
        >
          <p>
            {loginContent.eyebrow}
          </p>

          <h1>
            {loginContent.title}
          </h1>

          <span>
            {loginContent.description}
          </span>

          {isClient && (
            <div className="login-client-highlights">
              {loginContent.highlights.map(
                highlight => (
                  <article
                    key={highlight.title}
                  >
                    <i>
                      {highlight.icon}
                    </i>

                    <div>
                      <b>
                        {highlight.title}
                      </b>

                      <small>
                        {highlight.text}
                      </small>
                    </div>
                  </article>
                )
              )}
            </div>
          )}
        </div>

        {isClient && (
          <div className="login-sweets-gallery">
            <div className="login-gallery-label">
              <span>✦</span>
              Inspirações FriBolos
            </div>

            <figure className="login-sweet-main">
              <img
                src="/BoloDecorado.webp"
                alt="Bolo decorado FriBolos"
              />

              <figcaption>
                Bolos personalizados
              </figcaption>
            </figure>

            <figure className="login-sweet-secondary">
              <img
                src="/CupcakesDecorados.jpg"
                alt="Cupcakes decorados"
              />
            </figure>

            <figure className="login-sweet-tertiary">
              <img
                src="/DocesDecorados.jpeg"
                alt="Doces artesanais"
              />
            </figure>
          </div>
        )}

        <div className="login-rings" />
      </section>

      <section className="login-area">
        {isClient && (
          <header className="client-login-header">
            <div className="client-login-header-brand">
              <img
                src="/FaviconFribolos.png"
                alt=""
              />

              <div>
                <strong>
                  Fri<em>Bolos</em>
                </strong>

                <small>
                  Encomendas feitas com carinho
                </small>
              </div>
            </div>
          </header>
        )}
        <form
          className="login-card"
          onSubmit={handleLogin}
        >
          <div className="mobile-brand">
            <span>♨</span>

            <strong>
              Fri<em>Bolos</em>
            </strong>
          </div>

          {isClient && (
            <div className="client-welcome-logo">
              <img
                src="/FaviconFribolos.png"
                alt="FriBolos"
                width="72"
                height="72"
              />
            </div>
          )}

          <p className="eyebrow">
            {isClient
              ? "BEM-VINDO À FRIBOLOS"
              : "ACESSO ADMINISTRATIVO"}
          </p>

          <h2>
            {isClient
              ? "Que bom ter você por aqui!"
              : "Acesse o painel"}
          </h2>

          <p className="login-subtitle">
            {isClient
              ? "Entre para continuar planejando momentos deliciosos com a gente."
              : "Informe seus dados para acessar a gestão da confeitaria."}
          </p>

          {role === "admin" && (
            <div className="login-access-badge">
              <span>♚</span>

              <div>
                <b>
                  Acesso administrativo
                </b>

                <small>
                  Gestão completa da confeitaria
                </small>
              </div>
            </div>
          )}

          <label className="login-label">
            E-mail

            <div className="login-input">
              <span>✉</span>

                <input
                  required
                  type="email"
                  name="email"
                  value={loginEmail}
                  onChange={event => {
                    setLoginEmail(event.target.value);
                    setResetSent(false);
                  }}
                  placeholder="seu@email.com"
                  autoComplete="email"
                />
            </div>
          </label>

          <label className="login-label">
            Senha

            <div className="login-input">
              <span>⌑</span>

              <input
                required
                type={
                  showPassword ? "text" : "password"
                }
                name="password"
                placeholder="Sua senha"
                autoComplete="current-password"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(value => !value)
                }
                aria-label={
                  showPassword
                    ? "Ocultar senha"
                    : "Mostrar senha"
                }
              >
                {showPassword ? "◉" : "◎"}
              </button>
            </div>
          </label>

          <div className="login-options login-options-end">
            <button
              type="button"
              disabled={resetLoading}
              onClick={sendPasswordRecovery}
            >
              {resetLoading
                ? "Enviando..."
                : "Esqueci minha senha"}
            </button>
          </div>

          {error && (
            <p className="form-error">
              {error}
            </p>
          )}

          {resetSent && (
            <p className="form-success">
              ✓ Enviamos um link de recuperação para seu
              e-mail.
            </p>
          )}

          <button
            className="login-submit"
            type="submit"
            disabled={loading}
          >
          {loading
            ? "Entrando..."
            : "Entrar"}

            <span>→</span>
          </button>

          {role === "client" && (
            <div className="client-signup-invite">
              <span>♡</span>

              <div>
                <small>
                  É sua primeira visita?
                </small>

                <p>
                  Crie sua conta e faça sua primeira
                  encomenda.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSignup(true)}
              >
                Criar conta
                <span>→</span>
              </button>
            </div>
          )}
        </form>

        {isClient && (
          <div className="client-login-trust">
            <span>
              <i>✓</i>
              Dados protegidos
            </span>

            <span>
              <i>♡</i>
              Atendimento personalizado
            </span>

            <span>
              <i>♨</i>
              Produção artesanal
            </span>
          </div>
        )}

        <footer>
          © {new Date().getFullYear()} FriBolos
        </footer>
      </section>
    </main>
  );
}

function Signup({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState(1);
  const [created, setCreated] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] =
    useState("");

  async function submit(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();
    setError("");

    const form = e.currentTarget;
    const data = new FormData(form);

    const name = String(data.get("name") || "").trim();

    const email = String(data.get("email") || "")
      .trim()
      .toLowerCase();

    const phone = String(data.get("phone") || "").trim();

    const birthDate = String(
      data.get("birth") || ""
    );

    const zip = String(data.get("zip") || "").trim();

    const street = String(
      data.get("street") || ""
    ).trim();

    const number = String(
      data.get("number") || ""
    ).trim();

    const complement = String(
      data.get("complement") || ""
    ).trim();

    const district = String(
      data.get("district") || ""
    ).trim();

    const city = String(data.get("city") || "").trim();

    const password = String(
      data.get("password") || ""
    );

    const confirmPassword = String(
      data.get("confirm") || ""
    );

    if (!name || !email || !phone || !birthDate) {
      setError("Preencha todos os dados pessoais.");
      setStep(1);
      return;
    }

    if (!zip || !street || !number || !district || !city) {
      setError(
        "Preencha os dados obrigatórios do endereço."
      );
      setStep(2);
      return;
    }

    if (password.length < 6) {
      setError(
        "A senha deve possuir pelo menos 6 caracteres."
      );
      setStep(3);
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      setStep(3);
      return;
    }

    setLoading(true);

    try {
      const {
        data: authData,
        error: signUpError,
      } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            phone,
            birth_date: birthDate,

            address: {
              zip,
              street,
              number,
              complement,
              district,
              city,
            },
          },
        },
      });

      if (signUpError) {
        console.error(
          "Erro ao criar conta:",
          signUpError
        );

        if (
          signUpError.message
            .toLowerCase()
            .includes("already registered")
        ) {
          setError(
            "Já existe uma conta cadastrada com este e-mail."
          );
          return;
        }

        setError(signUpError.message);
        return;
      }

      if (!authData.user) {
        setError("Não foi possível criar a conta.");
        return;
      }

      setRegisteredEmail(email);
      setCreated(true);
    } catch (connectionError) {
      console.error(
        "Erro de conexão ao criar conta:",
        connectionError
      );

      setError(
        "Não foi possível conectar ao servidor. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  }

  if (created) {
    return (
      <main className="account-created">
        <section>
          <span>✓</span>

          <p className="eyebrow">
            CADASTRO CONCLUÍDO
          </p>

          <h1>Sua conta foi criada!</h1>

          <p>
            Enviamos uma confirmação para{" "}
            <strong>{registeredEmail}</strong>.
            Verifique seu e-mail antes de entrar.
          </p>

          <button type="button" onClick={onBack}>
            Ir para o login
          </button>

          <small>
            Sua conta e seu perfil foram cadastrados
            com segurança.
          </small>
        </section>
      </main>
    );
  }

  return (
    <main className="create-account">
      <aside>
        <div className="login-brand">
          <span>♨</span>

          <strong>
            Fri<em>Bolos</em>
          </strong>
        </div>

        <div className="create-copy">
          <p>SEU ESPAÇO DOCE</p>

          <h1>
            Crie sua conta
            <br />
            em poucos passos.
          </h1>

          <span>
            Acompanhe pedidos, personalize produtos e
            torne cada comemoração ainda mais especial.
          </span>
        </div>

        <ol>
          <li className={step >= 1 ? "active" : ""}>
            <b>1</b>
            Dados pessoais
          </li>

          <li className={step >= 2 ? "active" : ""}>
            <b>2</b>
            Endereço
          </li>

          <li className={step >= 3 ? "active" : ""}>
            <b>3</b>
            Segurança
          </li>
        </ol>
      </aside>

      <section className="create-form-area">
        <button
          type="button"
          className="back-login"
          onClick={onBack}
        >
          ‹ Voltar para o login
        </button>

        <form onSubmit={submit}>
          <p className="eyebrow">CRIAR CONTA</p>

          <h2>
            {step === 1
              ? "Vamos começar"
              : step === 2
                ? "Onde entregamos?"
                : "Proteja sua conta"}
          </h2>

          <p>Etapa {step} de 3</p>

          {/* ETAPA 1 — DADOS PESSOAIS */}

          <div
            className={`account-step ${
              step === 1 ? "visible" : ""
            }`}
          >
            <label>
              Nome completo

              <input
                required={step === 1}
                name="name"
                placeholder="Seu nome completo"
                autoComplete="name"
              />
            </label>

            <div className="field-row">
              <label>
                E-mail

                <input
                  required={step === 1}
                  type="email"
                  name="email"
                  placeholder="seu@email.com"
                  autoComplete="email"
                />
              </label>

              <label>
                Telefone

                <input
                  required={step === 1}
                  name="phone"
                  placeholder="(22) 99999-9999"
                  autoComplete="tel"
                />
              </label>
            </div>

            <label>
              Data de nascimento

              <input
                required={step === 1}
                type="date"
                name="birth"
              />
            </label>

            <button
              type="button"
              className="next-step"
              onClick={() => {
                setError("");
                setStep(2);
              }}
            >
              Continuar →
            </button>
          </div>

          {/* ETAPA 2 — ENDEREÇO */}

          <div
            className={`account-step ${
              step === 2 ? "visible" : ""
            }`}
          >
            <label>
              CEP

              <input
                required={step === 2}
                name="zip"
                placeholder="00000-000"
                autoComplete="postal-code"
              />
            </label>

            <label>
              Rua

              <input
                required={step === 2}
                name="street"
                placeholder="Nome da rua"
                autoComplete="street-address"
              />
            </label>

            <div className="field-row">
              <label>
                Número

                <input
                  required={step === 2}
                  name="number"
                  placeholder="Número"
                />
              </label>

              <label>
                Complemento

                <input
                  name="complement"
                  placeholder="Apartamento, bloco..."
                />
              </label>
            </div>

            <div className="field-row">
              <label>
                Bairro

                <input
                  required={step === 2}
                  name="district"
                  placeholder="Bairro"
                />
              </label>

              <label>
                Cidade

                <input
                  required={step === 2}
                  name="city"
                  placeholder="Cidade"
                  autoComplete="address-level2"
                />
              </label>
            </div>

            <div className="step-buttons">
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setStep(1);
                }}
              >
                Voltar
              </button>

              <button
                type="button"
                className="next-step"
                onClick={() => {
                  setError("");
                  setStep(3);
                }}
              >
                Continuar →
              </button>
            </div>
          </div>

          {/* ETAPA 3 — SEGURANÇA */}

          <div
            className={`account-step ${
              step === 3 ? "visible" : ""
            }`}
          >
            <label>
              Senha

              <input
                required={step === 3}
                minLength={6}
                type="password"
                name="password"
                placeholder="Mínimo de 6 caracteres"
                autoComplete="new-password"
              />
            </label>

            <label>
              Confirmar senha

              <input
                required={step === 3}
                minLength={6}
                type="password"
                name="confirm"
                placeholder="Repita sua senha"
                autoComplete="new-password"
              />
            </label>

            <label className="accept-terms">
              <input
                required={step === 3}
                type="checkbox"
              />

              <span>
                Li e aceito os Termos de uso e a
                Política de privacidade.
              </span>
            </label>

            <div className="step-buttons">
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setStep(2);
                }}
              >
                Voltar
              </button>

              <button
                type="submit"
                className="next-step"
                disabled={loading}
              >
                {loading
                  ? "Criando conta..."
                  : "Criar minha conta →"}
              </button>
            </div>
          </div>

          {error && (
            <p className="form-error">
              {error}
            </p>
          )}
        </form>

        <p className="has-account">
          Já possui uma conta?{" "}

          <button type="button" onClick={onBack}>
            Entrar
          </button>
        </p>
      </section>
    </main>
  );
}