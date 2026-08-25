// @vitest-environment jsdom

import {
  fireEvent,
  render,
  screen,
} from "@testing-library/react";

import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  AppNotification,
} from "../app/types";

import {
  NotificationPanel,
} from "../app/components/notification-panel";

function createNotification(
  changes: Record<
    string,
    unknown
  > = {}
): AppNotification {
  return {
    id: "notification-1",
    title:
      "Status do pedido atualizado",
    message:
      "O pedido #15 foi atualizado para Entregue.",
    type: "order",
    relatedEntityType: "order",
    relatedEntityId: "order-15",
    isRead: false,
    createdAt:
      "2026-08-25T14:11:00",
    ...changes,
  } as unknown as AppNotification;
}

function renderNotifications({
  items = [
    createNotification(),
  ],
  loading = false,
  onClose = vi.fn(),
  onRead = vi.fn(),
  onSelect = vi.fn(),
}: {
  items?: AppNotification[];
  loading?: boolean;
  onClose?: () => void;
  onRead?: () => void;

  onSelect?: (
    notification:
      AppNotification
  ) => void;
} = {}) {
  const result = render(
    <NotificationPanel
      items={items}
      loading={loading}
      onClose={onClose}
      onRead={onRead}
      onSelect={onSelect}
    />
  );

  return {
    ...result,
    onClose,
    onRead,
    onSelect,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("NotificationPanel", () => {
  it("mostra o estado de carregamento", () => {
    renderNotifications({
      loading: true,
      items: [],
    });

    expect(
      screen.getByText(
        "Carregando notificações..."
      )
    ).toBeInTheDocument();
  });

  it("mostra o estado vazio", () => {
    const {
      container,
    } = renderNotifications({
      items: [],
    });

    expect(
      container.querySelector(
        ".empty-notifications"
      )
    ).toBeInTheDocument();

    expect(
      container.querySelector(
        ".notification-item"
      )
    ).not.toBeInTheDocument();
  });

  it("mostra título e mensagem da notificação", () => {
    renderNotifications();

    expect(
      screen.getByText(
        "Status do pedido atualizado"
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "O pedido #15 foi atualizado para Entregue."
      )
    ).toBeInTheDocument();
  });

  it("formata a data da notificação", () => {
    renderNotifications();

    expect(
      screen.getByText(
        "25/08, 14:11"
      )
    ).toBeInTheDocument();
  });

  it("marca notificação não lida com a classe correta", () => {
    const {
      container,
    } = renderNotifications();

    expect(
      container.querySelector(
        ".notification-item"
      )
    ).toHaveClass(
      "notification-unread"
    );
  });

  it("marca notificação lida com a classe correta", () => {
    const {
      container,
    } = renderNotifications({
      items: [
        createNotification({
          isRead: true,
        }),
      ],
    });

    expect(
      container.querySelector(
        ".notification-item"
      )
    ).toHaveClass(
      "notification-read"
    );
  });

  it("seleciona a notificação e fecha o painel", () => {
    const notification =
      createNotification();

    const {
      onSelect,
      onClose,
    } = renderNotifications({
      items: [
        notification,
      ],
    });

    fireEvent.click(
      screen.getByRole("button", {
        name:
          /Status do pedido atualizado/i,
      })
    );

    expect(
      onSelect
    ).toHaveBeenCalledWith(
      notification
    );

    expect(
      onClose
    ).toHaveBeenCalledOnce();
  });

  it("não seleciona item quando onSelect não foi informado", () => {
    const onClose = vi.fn();

    const {
      container,
    } = render(
      <NotificationPanel
        items={[
          createNotification(),
        ]}
        loading={false}
        onClose={onClose}
        onRead={vi.fn()}
      />
    );

    fireEvent.click(
      screen.getByRole("button", {
        name:
          /Status do pedido atualizado/i,
      })
    );

    expect(
      onClose
    ).not.toHaveBeenCalled();

    expect(
      container.querySelector(
        ".notification-item"
      )
    ).not.toHaveClass(
      "notification-clickable"
    );
  });

  it("marca todas as notificações como lidas", () => {
    const {
      onRead,
    } = renderNotifications();

    fireEvent.click(
      screen.getByRole("button", {
        name:
          "Marcar todas como lidas",
      })
    );

    expect(
      onRead
    ).toHaveBeenCalledOnce();
  });

  it("oculta o botão quando todas já estão lidas", () => {
    renderNotifications({
      items: [
        createNotification({
          isRead: true,
        }),
      ],
    });

    expect(
      screen.queryByRole(
        "button",
        {
          name:
            "Marcar todas como lidas",
        }
      )
    ).not.toBeInTheDocument();
  });

  it("fecha pelo botão do cabeçalho", () => {
    const {
      onClose,
    } = renderNotifications();

    fireEvent.click(
      screen.getByRole("button", {
        name:
          "Fechar notificações",
      })
    );

    expect(
      onClose
    ).toHaveBeenCalledOnce();
  });

  it("fecha quando a tecla Escape é pressionada", () => {
    const {
      onClose,
    } = renderNotifications();

    fireEvent.keyDown(
      document,
      {
        key: "Escape",
      }
    );

    expect(
      onClose
    ).toHaveBeenCalledOnce();
  });

  it("fecha ao clicar fora do painel", () => {
    const {
      onClose,
    } = renderNotifications();

    fireEvent.pointerDown(
      document.body
    );

    expect(
      onClose
    ).toHaveBeenCalledOnce();
  });

  it("não fecha ao clicar dentro do painel", () => {
    const {
      container,
      onClose,
    } = renderNotifications();

    fireEvent.pointerDown(
      container.querySelector(
        ".notification-panel"
      )!
    );

    expect(
      onClose
    ).not.toHaveBeenCalled();
  });

  it("fecha quando a página fica oculta", () => {
    const {
      onClose,
    } = renderNotifications();

    Object.defineProperty(
      document,
      "hidden",
      {
        configurable: true,
        value: true,
      }
    );

    fireEvent(
      document,
      new Event(
        "visibilitychange"
      )
    );

    expect(
      onClose
    ).toHaveBeenCalledOnce();

    Object.defineProperty(
      document,
      "hidden",
      {
        configurable: true,
        value: false,
      }
    );
  });

  it("renderiza diferentes tipos de notificação", () => {
    const {
      container,
    } = renderNotifications({
      items: [
        createNotification({
          id: "order",
          type: "order",
        }),

        createNotification({
          id: "quote",
          type: "quote",
          title: "Novo orçamento",
        }),

        createNotification({
          id: "payment",
          type: "payment",
          title:
            "Pagamento confirmado",
        }),
      ],
    });

    expect(
      container.querySelectorAll(
        ".notification-item"
      )
    ).toHaveLength(3);

    expect(
      screen.getByText(
        "Novo orçamento"
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "Pagamento confirmado"
      )
    ).toBeInTheDocument();
  });
});