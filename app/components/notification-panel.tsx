
"use client";

import {
  useEffect,
  useRef,
} from "react";

import type { AppNotification } from "../types";

export function NotificationPanel({
  items,
  loading,
  onClose,
  onRead,
}: {
  items: AppNotification[];
  loading: boolean;
  onClose: () => void;
  onRead: () => void;
}) {
  function notificationDate(
    createdAt: string
  ) {
    const date = new Date(createdAt);

    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function notificationIcon(type: string) {
    const icons: Record<string, string> = {
      order: "▢",
      quote: "◇",
      stock: "▦",
      payment: "$",
      account: "♙",
      review: "★",
      general: "✓",
    };

    return icons[type] || "✓";
  }

  const panelRef =
    useRef<HTMLElement>(null);

  useEffect(() => {
    function handleClickOutside(
      event: PointerEvent
    ) {
      const target =
        event.target;

      if (
        !(target instanceof Node)
      ) {
        return;
      }

      if (
        panelRef.current &&
        !panelRef.current.contains(
          target
        )
      ) {
        onClose();
      }
    }

    function handleKeyDown(
      event: KeyboardEvent
    ) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        onClose();
      }
    }

    document.addEventListener(
      "pointerdown",
      handleClickOutside
    );

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handleClickOutside
      );

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [onClose]);

  return (
    <aside
      ref={panelRef}
      className="notification-panel"
    >
      <header>
        <div>
          <p className="eyebrow">
            ATUALIZAÇÕES
          </p>

          <h2>Notificações</h2>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar notificações"
        >
          ×
        </button>
      </header>

      {loading ? (
        <div className="empty-notifications">
          <span>◌</span>
          <p>Carregando notificações...</p>
        </div>
      ) : items.length > 0 ? (
        <>
          <div>
            {items.map(item => (
              <article
                key={item.id}
                className={
                  item.isRead
                    ? "notification-read"
                    : "notification-unread"
                }
              >
                <span>
                  {notificationIcon(item.type)}
                </span>

                <div>
                  <b>{item.title}</b>
                  <p>{item.message}</p>

                  <small>
                    {notificationDate(
                      item.createdAt
                    )}
                  </small>
                </div>
              </article>
            ))}
          </div>

          {items.some(item => !item.isRead) && (
            <button
              type="button"
              className="read-all"
              onClick={onRead}
            >
              Marcar todas como lidas
            </button>
          )}
        </>
      ) : (
        <div className="empty-notifications">
          <span>✓</span>
          <p>Tudo em dia por aqui.</p>
        </div>
      )}
    </aside>
  );
}