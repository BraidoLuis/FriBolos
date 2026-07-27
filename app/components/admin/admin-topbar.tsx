"use client";

import {
  getFirstName,
  getInitials,
} from "../../lib/formatters";

import {
  ThemeToggle,
} from "../theme-toggle";

import type {
  Screen,
} from "../../types";

type AdminTopbarProps = {
  screen: Screen;
  query: string;

  userName: string;

  unreadNotificationsCount:
    number;

  onQueryChange: (
    query: string
  ) => void;

  onOpenMenu: () => void;

  onToggleNotifications:
    () => void;

  onLogout: () =>
    void | Promise<void>;
};

export function AdminTopbar({
  screen,
  query,
  userName,
  unreadNotificationsCount,
  onQueryChange,
  onOpenMenu,
  onToggleNotifications,
  onLogout,
}: AdminTopbarProps) {
  const currentDate =
    new Intl.DateTimeFormat(
      "pt-BR",
      {
        weekday: "long",
        day: "2-digit",
        month: "long",
      }
    )
      .format(new Date())
      .toLocaleUpperCase(
        "pt-BR"
      );

  const safeUserName =
    userName || "Administrador";

  const pageTitle =
    screen === "Visão geral"
      ? `Bom dia, ${getFirstName(
          safeUserName
        )}`
      : screen;

  const pageDescription =
    screen === "Visão geral"
      ? "Aqui está o resumo da sua confeitaria hoje."
      : `Gerencie ${screen.toLowerCase()} da sua confeitaria.`;

  return (
    <header className="topbar">
      <button
        type="button"
        className="menu"
        onClick={onOpenMenu}
        aria-label="Abrir menu"
      >
        ☰
      </button>

      <div>
        <p className="eyebrow">
          {currentDate}
        </p>

        <h1>{pageTitle}</h1>

        <p>{pageDescription}</p>
      </div>

      <div className="header-actions">
        <label className="search">
          <span>⌕</span>

          <input
            value={query}
            onChange={event =>
              onQueryChange(
                event.target.value
              )
            }
            placeholder="Buscar..."
            aria-label="Buscar pedidos"
          />
        </label>

        <ThemeToggle />

        <button
          type="button"
          className="bell"
          aria-label={`Abrir notificações. ${unreadNotificationsCount} não lidas`}
          onClick={
            onToggleNotifications
          }
        >
          <span>♧</span>

          {unreadNotificationsCount >
            0 && (
            <b>
              {unreadNotificationsCount >
              99
                ? "99+"
                : unreadNotificationsCount}
            </b>
          )}
        </button>

        <div className="avatar">
          {getInitials(
            safeUserName
          )}
        </div>

        <button
          type="button"
          className="user user-button"
          onClick={onLogout}
          title="Sair da conta"
        >
          <strong>
            {safeUserName}
          </strong>

          <small>
            <span className="user-role">
              Administrador •{" "}
            </span>

            Sair
          </small>
        </button>
      </div>
    </header>
  );
}