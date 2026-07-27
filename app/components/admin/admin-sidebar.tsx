"use client";

import type { Screen } from "../../types";

const navigation: {
  label: Screen;
  icon: string;
}[] = [
  {
    label: "Visão geral",
    icon: "⌂",
  },
  {
    label: "Pedidos",
    icon: "▢",
  },
  {
    label: "Orçamentos",
    icon: "◇",
  },
  {
    label: "Produção",
    icon: "♨",
  },
  {
    label: "Cardápio",
    icon: "▤",
  },
  {
    label: "Estoque",
    icon: "▦",
  },
  {
    label: "Clientes",
    icon: "♙",
  },
  {
    label: "Financeiro",
    icon: "$",
  },
  {
    label: "Relatórios",
    icon: "▥",
  },
  {
    label: "Configurações",
    icon: "⚙",
  },
];

type AdminSidebarProps = {
  screen: Screen;
  open: boolean;
  storeName: string;

  onScreenChange: (
    screen: Screen
  ) => void;

  onClose: () => void;
  onNewOrder: () => void;
};

export function AdminSidebar({
  screen,
  open,
  storeName,
  onScreenChange,
  onClose,
  onNewOrder,
}: AdminSidebarProps) {
  function selectScreen(
    selectedScreen: Screen
  ) {
    onScreenChange(
      selectedScreen
    );

    onClose();
  }

  return (
    <aside
      className={`sidebar ${
        open ? "open" : ""
      }`}
    >
      <button
        type="button"
        className="close-menu"
        onClick={onClose}
        aria-label="Fechar menu"
      >
        ×
      </button>

      <div className="brand">
        <span className="cake">
          ♨
        </span>

        <strong>
          {storeName || "FriBolos"}
        </strong>
      </div>

      <div className="ornament">
        <span />
        ✤
        <span />
      </div>

      <nav>
        {navigation.map(item => (
          <button
            type="button"
            key={item.label}
            className={
              screen === item.label
                ? "active"
                : ""
            }
            onClick={() =>
              selectScreen(
                item.label
              )
            }
          >
            <b>{item.icon}</b>

            {item.label}
          </button>
        ))}
      </nav>

      <button
        type="button"
        className="new-order side"
        onClick={onNewOrder}
      >
        <span>＋</span>
        Novo pedido
      </button>

    </aside>
  );
}