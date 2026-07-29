"use client";

import {
  useState,
  type FormEvent,
} from "react";

import { LoginReviewsCarousel } from "./login-reviews-carousel";

import { supabase } from "../../lib/supabase";

import {
  maximumBirthDate,
  formatZipCode,
  minimumBirthDate,
} from "../../lib/formatters";

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
      {isClient ? (
        <header className="login-client-topbar">

          <div className="login-client-topbar-actions">
            <a
              href="/catalogo"
              className="login-catalog-header-link"
            >
              <span>♨</span>

              <div>
                <b>Conhecer o catálogo</b>

                <small>
                  Veja nossas delícias
                </small>
              </div>

              <i>→</i>
            </a>

            <ThemeToggle />
          </div>
        </header>
      ) : (
        <div className="login-theme-toggle">
          <ThemeToggle />
        </div>
      )}

      <section className="login-showcase">
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
            <>
              <LoginReviewsCarousel />

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
            </>
          )}
        </div>

        {isClient && (
          <div className="login-sweets-gallery">
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

function formatPhone(
  value: string
) {
  const digits = value
    .replace(/\D/g, "")
    .slice(0, 11);

  if (!digits) {
    return "";
  }

  if (digits.length <= 2) {
    return `(${digits}`;
  }

  if (digits.length <= 7) {
    return `(${digits.slice(
      0,
      2
    )}) ${digits.slice(2)}`;
  }

  return `(${digits.slice(
    0,
    2
  )}) ${digits.slice(
    2,
    7
  )}-${digits.slice(7)}`;
}

function Signup({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState(1);
  const [created, setCreated] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] =
    useState("");

  function validatePersonalData(
    form: HTMLFormElement
  ) {
    const data =
      new FormData(form);

    const name = String(
      data.get("name") || ""
    ).trim();

    const email = String(
      data.get("email") || ""
    )
      .trim()
      .toLowerCase();

    const phone = String(
      data.get("phone") || ""
    ).trim();

    const birthDate = String(
      data.get("birth") || ""
    );

    if (
      !name ||
      !email ||
      !phone ||
      !birthDate
    ) {
      setError(
        "Preencha todos os dados pessoais."
      );

      return false;
    }

    /*
    * Exige pelo menos nome e sobrenome.
    * Permite letras, espaços, hífen e apóstrofo.
    */
    const namePattern =
      /^[\p{L}][\p{L}'’-]*(?:\s+[\p{L}][\p{L}'’-]*)+$/u;

    if (
      name.length < 5 ||
      name.length > 100 ||
      !namePattern.test(name)
    ) {
      setError(
        "Informe seu nome completo, sem números ou caracteres inválidos."
      );

      return false;
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      email.length > 254 ||
      !emailPattern.test(email)
    ) {
      setError(
        "Informe um endereço de e-mail válido."
      );

      return false;
    }

    const phonePattern =
      /^\(\d{2}\) \d{5}-\d{4}$/;

    if (!phonePattern.test(phone)) {
      setError(
        "Informe um telefone válido no formato (22) 99999-9999."
      );

      return false;
    }

    if (
      birthDate <
        minimumBirthDate() ||
      birthDate >
        maximumBirthDate()
    ) {
      setError(
        "Informe uma data de nascimento válida."
      );

      return false;
    }

    const parsedBirthDate =
      new Date(
        `${birthDate}T12:00:00`
      );

    if (
      Number.isNaN(
        parsedBirthDate.getTime()
      )
    ) {
      setError(
        "Informe uma data de nascimento válida."
      );

      return false;
    }

    setError("");

    return true;
  }

  function validateAddressData(
    form: HTMLFormElement
  ) {
    const data =
      new FormData(form);

    const zip = String(
      data.get("zip") || ""
    ).trim();

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

    const city = String(
      data.get("city") || ""
    ).trim();

    if (
      !zip ||
      !street ||
      !number ||
      !district ||
      !city
    ) {
      setError(
        "Preencha os dados obrigatórios do endereço."
      );

      return false;
    }

    const zipPattern =
      /^\d{5}-\d{3}$/;

    if (
      !zipPattern.test(zip) ||
      zip === "00000-000"
    ) {
      setError(
        "Informe um CEP válido no formato 00000-000."
      );

      return false;
    }

    /*
    * A rua precisa ter ao menos
    * uma letra e entre 3 e 120 caracteres.
    * Números continuam permitidos,
    * como em “Rua 7”.
    */
    if (
      street.length < 3 ||
      street.length > 120 ||
      !/\p{L}/u.test(street)
    ) {
      setError(
        "Informe um nome de rua válido."
      );

      return false;
    }

    /*
    * Aceita números como:
    * 123, 123A, 12-14 e também S/N.
    */
    const addressNumberPattern =
      /^(?:s\/n|(?=.*\d)[\p{L}\d\s./-]+)$/iu;

    if (
      number.length > 20 ||
      !addressNumberPattern.test(number)
    ) {
      setError(
        "Informe o número do endereço ou use S/N."
      );

      return false;
    }

    if (complement.length > 100) {
      setError(
        "O complemento deve possuir no máximo 100 caracteres."
      );

      return false;
    }

    if (
      district.length < 2 ||
      district.length > 80 ||
      !/\p{L}/u.test(district)
    ) {
      setError(
        "Informe um bairro válido."
      );

      return false;
    }

    if (
      city.length < 2 ||
      city.length > 80 ||
      !/\p{L}/u.test(city)
    ) {
      setError(
        "Informe uma cidade válida."
      );

      return false;
    }

    setError("");

    return true;
  }

  function validateSecurityData(
    form: HTMLFormElement
  ) {
    const data =
      new FormData(form);

    const password = String(
      data.get("password") || ""
    );

    const confirmPassword = String(
      data.get("confirm") || ""
    );

    const acceptedTerms =
      data.get("terms") === "on";

    if (
      !password ||
      !confirmPassword
    ) {
      setError(
        "Preencha e confirme sua senha."
      );

      return false;
    }

    if (
      password.length < 8 ||
      password.length > 72
    ) {
      setError(
        "A senha deve possuir entre 8 e 72 caracteres."
      );

      return false;
    }

    if (/\s/.test(password)) {
      setError(
        "A senha não pode conter espaços."
      );

      return false;
    }

    if (!/[a-z]/.test(password)) {
      setError(
        "A senha deve possuir pelo menos uma letra minúscula."
      );

      return false;
    }

    if (!/[A-Z]/.test(password)) {
      setError(
        "A senha deve possuir pelo menos uma letra maiúscula."
      );

      return false;
    }

    if (!/\d/.test(password)) {
      setError(
        "A senha deve possuir pelo menos um número."
      );

      return false;
    }

    if (
      password !==
      confirmPassword
    ) {
      setError(
        "As senhas não coincidem."
      );

      return false;
    }

    if (!acceptedTerms) {
      setError(
        "Você precisa aceitar os Termos de uso e a Política de privacidade."
      );

      return false;
    }

    setError("");

    return true;
  }

  async function submit(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();
    setError("");

    const form = e.currentTarget;
    const data = new FormData(form);

    if (!validatePersonalData(form)) {
      setStep(1);

      return;
    }

    if (!validateAddressData(form)) {
      setStep(2);

      return;
    }

    if (!validateSecurityData(form)) {
      setStep(3);

      return;
    }

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
        <div className="login-theme-toggle">
          <ThemeToggle />
        </div>

        <section>
          <span>✓</span>

          <p className="eyebrow">
            CADASTRO CONCLUÍDO
          </p>

          <h1>Sua conta foi criada!</h1>

          <p>
            Enviamos uma confirmação para{" "}
            <strong>
              {registeredEmail}
            </strong>
            . Verifique seu e-mail antes de entrar.
          </p>

          <button
            type="button"
            onClick={onBack}
          >
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
      <div className="login-theme-toggle">
        <ThemeToggle />
      </div>
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
                  type="tel"
                  name="phone"
                  inputMode="numeric"
                  maxLength={15}
                  placeholder="(22) 99999-9999"
                  autoComplete="tel"
                  pattern="\(\d{2}\) \d{5}-\d{4}"
                  title="Informe o telefone no formato (22) 99999-9999"
                  onInput={event => {
                    event.currentTarget.value =
                      formatPhone(
                        event.currentTarget.value
                      );
                  }}
                />
              </label>
            </div>

            <label>
              Data de nascimento

              <input
                required={step === 1}
                type="date"
                name="birth"
                min={minimumBirthDate()}
                max={maximumBirthDate()}
                autoComplete="bday"
              />
            </label>

            <button
              type="button"
              className="next-step"
              onClick={event => {
                const form =
                  event.currentTarget.form;

                if (
                  !form ||
                  !validatePersonalData(form)
                ) {
                  return;
                }

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
                type="text"
                inputMode="numeric"
                maxLength={9}
                placeholder="00000-000"
                autoComplete="postal-code"
                pattern="\d{5}-\d{3}"
                title="Informe o CEP no formato 00000-000"
                onInput={event => {
                  event.currentTarget.value =
                    formatZipCode(
                      event.currentTarget.value
                    );
                }}
              />
            </label>

            <label>
              Rua

              <input
                required={step === 2}
                name="street"
                minLength={3}
                maxLength={120}
                placeholder="Nome da rua"
                autoComplete="address-line1"
              />
            </label>

            <div className="field-row">
              <label>
                Número

                <input
                  required={step === 2}
                  name="number"
                  maxLength={20}
                  placeholder="Número ou S/N"
                  autoComplete="address-line2"
                />
              </label>

              <label>
                Complemento

                <input
                  name="complement"
                  maxLength={100}
                  placeholder="Apartamento, bloco..."
                  autoComplete="address-line2"
                />
              </label>
            </div>

            <div className="field-row">
              <label>
                Bairro

                <input
                  required={step === 2}
                  name="district"
                  minLength={2}
                  maxLength={80}
                  placeholder="Bairro"
                  autoComplete="address-level3"
                />
              </label>

              <label>
                Cidade

                <input
                  required={step === 2}
                  name="city"
                  minLength={2}
                  maxLength={80}
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
                onClick={event => {
                  const form =
                    event.currentTarget.form;

                  if (
                    !form ||
                    !validateAddressData(form)
                  ) {
                    return;
                  }

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
                minLength={8}
                maxLength={72}
                type="password"
                name="password"
                placeholder="Crie uma senha segura"
                autoComplete="new-password"
              />

              <small>
                Use pelo menos 8 caracteres, com letra
                maiúscula, minúscula e número.
              </small>
            </label>

            <label>
              Confirmar senha

              <input
                required={step === 3}
                minLength={8}
                maxLength={72}
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
                name="terms"
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