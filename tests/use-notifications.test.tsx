// @vitest-environment jsdom

import {
  act,
  renderHook,
  waitFor,
} from "@testing-library/react";

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  select: vi.fn(),
  order: vi.fn(),
  limit: vi.fn(),

  update: vi.fn(),
  updateIn: vi.fn(),

  channel: vi.fn(),
  channelOn: vi.fn(),
  subscribe: vi.fn(),
  removeChannel: vi.fn(),

  getUser: vi.fn(),
}));

const realtimeCallbacks = vi.hoisted(
  () => ({
    insert:
      undefined as
        | ((payload: {
            new: Record<
              string,
              unknown
            >;
          }) => void)
        | undefined,

    status:
      undefined as
        | ((status: string) => void)
        | undefined,
  })
);

const channelObject = vi.hoisted(
  () => ({
    on: mocks.channelOn,
    subscribe: mocks.subscribe,
  })
);

vi.mock(
  "../app/lib/supabase",
  () => ({
    supabase: {
      from: mocks.from,
      channel: mocks.channel,

      removeChannel:
        mocks.removeChannel,

      auth: {
        getUser: mocks.getUser,
      },
    },
  })
);

import {
  useNotifications,
} from "../app/hooks/use-notifications";

function createNotificationRow(
  changes: Record<
    string,
    unknown
  > = {}
) {
  return {
    id: "notification-1",
    title:
      "Status do pedido atualizado",
    message:
      "O pedido #15 foi atualizado para Entregue.",
    type: "order",

    related_entity_type:
      "order",

    related_entity_id:
      "order-1",

    is_read: false,

    created_at:
      "2026-08-25T12:00:00.000Z",

    ...changes,
  };
}

function renderUseNotifications({
  authLoading = false,
  role = "client",
}: {
  authLoading?: boolean;

  role?:
    | "admin"
    | "client"
    | null;
} = {}) {
  return renderHook(
    ({
      currentAuthLoading,
      currentRole,
    }: {
      currentAuthLoading:
        boolean;

      currentRole:
        | "admin"
        | "client"
        | null;
    }) =>
      useNotifications({
        authLoading:
          currentAuthLoading,

        role: currentRole,
      }),

    {
      initialProps: {
        currentAuthLoading:
          authLoading,

        currentRole: role,
      },
    }
  );
}

beforeEach(() => {
  mocks.from.mockReset();
  mocks.select.mockReset();
  mocks.order.mockReset();
  mocks.limit.mockReset();

  mocks.update.mockReset();
  mocks.updateIn.mockReset();

  mocks.channel.mockReset();
  mocks.channelOn.mockReset();
  mocks.subscribe.mockReset();
  mocks.removeChannel.mockReset();

  mocks.getUser.mockReset();

  realtimeCallbacks.insert =
    undefined;

  realtimeCallbacks.status =
    undefined;

  mocks.limit.mockResolvedValue({
    data: [
      createNotificationRow(),
    ],

    error: null,
  });

  mocks.updateIn.mockResolvedValue({
    error: null,
  });

  mocks.select.mockReturnValue({
    order: mocks.order,
  });

  mocks.order.mockReturnValue({
    limit: mocks.limit,
  });

  mocks.update.mockReturnValue({
    in: mocks.updateIn,
  });

  mocks.from.mockReturnValue({
    select: mocks.select,
    update: mocks.update,
  });

  mocks.getUser.mockResolvedValue({
    data: {
      user: {
        id: "user-1",
      },
    },

    error: null,
  });

  mocks.channel.mockReturnValue(
    channelObject
  );

  mocks.channelOn.mockImplementation(
    (
      _event,
      _configuration,
      callback
    ) => {
      realtimeCallbacks.insert =
        callback;

      return channelObject;
    }
  );

  mocks.subscribe.mockImplementation(
    callback => {
      realtimeCallbacks.status =
        callback;

      return channelObject;
    }
  );

  vi.stubGlobal("crypto", {
    randomUUID: vi.fn(
      () => "uuid-123"
    ),
  });

  vi.spyOn(
    console,
    "error"
  ).mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe(
  "useNotifications - acesso e estado",
  () => {
    it("não consulta enquanto a autenticação carrega", async () => {
      renderUseNotifications({
        authLoading: true,
      });

      await act(async () => {
        await new Promise(resolve =>
          window.setTimeout(
            resolve,
            0
          )
        );
      });

      expect(
        mocks.from
      ).not.toHaveBeenCalled();

      expect(
        mocks.channel
      ).not.toHaveBeenCalled();
    });

    it("não consulta sem usuário autenticado", async () => {
      renderUseNotifications({
        role: null,
      });

      await act(async () => {
        await new Promise(resolve =>
          window.setTimeout(
            resolve,
            0
          )
        );
      });

      expect(
        mocks.from
      ).not.toHaveBeenCalled();

      expect(
        mocks.channel
      ).not.toHaveBeenCalled();
    });

    it("inicia com o painel fechado", () => {
      const {
        result,
      } = renderUseNotifications({
        authLoading: true,
      });

      expect(
        result.current
          .notificationsOpen
      ).toBe(false);
    });

    it("permite abrir e fechar o painel", () => {
      const {
        result,
      } = renderUseNotifications({
        authLoading: true,
      });

      act(() => {
        result.current
          .setNotificationsOpen(true);
      });

      expect(
        result.current
          .notificationsOpen
      ).toBe(true);

      act(() => {
        result.current
          .setNotificationsOpen(false);
      });

      expect(
        result.current
          .notificationsOpen
      ).toBe(false);
    });
  }
);

describe(
  "useNotifications - carregamento",
  () => {
    it("carrega e mapeia as notificações", async () => {
      const {
        result,
      } = renderUseNotifications();

      await waitFor(() => {
        expect(
          result.current.notifications
        ).toHaveLength(1);
      });

      expect(
        mocks.from
      ).toHaveBeenCalledWith(
        "notifications"
      );

      expect(
        mocks.order
      ).toHaveBeenCalledWith(
        "created_at",
        {
          ascending: false,
        }
      );

      expect(
        mocks.limit
      ).toHaveBeenCalledWith(30);

      expect(
        result.current.notifications[0]
      ).toEqual({
        id: "notification-1",

        title:
          "Status do pedido atualizado",

        message:
          "O pedido #15 foi atualizado para Entregue.",

        type: "order",

        relatedEntityType:
          "order",

        relatedEntityId:
          "order-1",

        isRead: false,

        createdAt:
          "2026-08-25T12:00:00.000Z",
      });
    });

    it("calcula a quantidade de não lidas", async () => {
      mocks.limit.mockResolvedValue({
        data: [
          createNotificationRow({
            id: "notification-1",
            is_read: false,
          }),

          createNotificationRow({
            id: "notification-2",
            is_read: true,
          }),

          createNotificationRow({
            id: "notification-3",
            is_read: false,
          }),
        ],

        error: null,
      });

      const {
        result,
      } = renderUseNotifications();

      await waitFor(() => {
        expect(
          result.current.notifications
        ).toHaveLength(3);
      });

      expect(
        result.current
          .unreadNotificationsCount
      ).toBe(2);
    });

    it("trata retorno nulo como lista vazia", async () => {
    mocks.limit.mockResolvedValue({
        data: null,
        error: null,
    });

    const {
        result,
    } = renderUseNotifications();

    await waitFor(() => {
        expect(
        mocks.limit
        ).toHaveBeenCalledOnce();

        expect(
        result.current
            .notificationsLoading
        ).toBe(false);
    });

    expect(
        result.current.notifications
    ).toEqual([]);
    });

    it(
      "limpa as notificações quando o carregamento falha",
      async () => {
        mocks.limit.mockResolvedValue({
          data: null,

          error: {
            message:
              "Falha ao consultar notificações",
          },
        });

        const {
          result,
        } = renderUseNotifications();

        await waitFor(() => {
          expect(
            mocks.limit
          ).toHaveBeenCalledOnce();
        });

        /*
        * O console.error acontece somente
        * depois que a Promise da consulta
        * retorna o erro. Assim, aguardamos
        * o fluxo assíncrono terminar de fato.
        */
        await waitFor(() => {
          expect(
            console.error
          ).toHaveBeenCalled();

          expect(
            result.current
              .notificationsLoading
          ).toBe(false);
        });

        expect(
          result.current.notifications
        ).toEqual([]);
      }
    );

    it("mantém o estado de carregamento enquanto a consulta está pendente", async () => {
      let resolveLoad:
        | ((value: {
            data: [];
            error: null;
          }) => void)
        | undefined;

      mocks.limit.mockReturnValue(
        new Promise(resolve => {
          resolveLoad = resolve;
        })
      );

      const {
        result,
      } = renderUseNotifications();

      expect(
        result.current
          .notificationsLoading
      ).toBe(true);

      await act(async () => {
        resolveLoad?.({
          data: [],
          error: null,
        });
      });

      await waitFor(() => {
        expect(
          result.current
            .notificationsLoading
        ).toBe(false);
      });
    });

    it("limpa as notificações ao sair da conta", async () => {
      const {
        result,
        rerender,
      } = renderUseNotifications();

      await waitFor(() => {
        expect(
          result.current.notifications
        ).toHaveLength(1);
      });

      rerender({
        currentAuthLoading: false,
        currentRole: null,
      });

      await waitFor(() => {
        expect(
          result.current.notifications
        ).toEqual([]);
      });
    });
  }
);

describe(
  "useNotifications - tempo real",
  () => {
    it("cria um canal exclusivo para o usuário", async () => {
      renderUseNotifications();

      await waitFor(() => {
        expect(
          mocks.channel
        ).toHaveBeenCalledWith(
          "notifications-uuid-123"
        );
      });

      await waitFor(() => {
        expect(
          mocks.channelOn
        ).toHaveBeenCalledWith(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",

            filter:
              "user_id=eq.user-1",
          },
          expect.any(Function)
        );
      });
    });

    it("adiciona uma nova notificação no início", async () => {
      const {
        result,
      } = renderUseNotifications();

      await waitFor(() => {
        expect(
          result.current.notifications
        ).toHaveLength(1);
      });

      await waitFor(() => {
        expect(
          realtimeCallbacks.insert
        ).toBeTypeOf("function");
      });

      act(() => {
        realtimeCallbacks.insert?.({
          new: createNotificationRow({
            id: "notification-2",

            title:
              "Novo orçamento",

            message:
              "Você recebeu uma proposta.",

            type: "quote",

            related_entity_type:
              "quote",

            related_entity_id:
              "quote-1",

            created_at:
              "2026-08-25T13:00:00.000Z",
          }),
        });
      });

      expect(
        result.current.notifications
      ).toHaveLength(2);

      expect(
        result.current.notifications[0]
      ).toMatchObject({
        id: "notification-2",
        title: "Novo orçamento",
        type: "quote",

        relatedEntityType:
          "quote",

        relatedEntityId:
          "quote-1",
      });

      expect(
        result.current
          .unreadNotificationsCount
      ).toBe(2);
    });

    it("não adiciona uma notificação duplicada", async () => {
      const {
        result,
      } = renderUseNotifications();

      await waitFor(() => {
        expect(
          result.current.notifications
        ).toHaveLength(1);
      });

      await waitFor(() => {
        expect(
          realtimeCallbacks.insert
        ).toBeTypeOf("function");
      });

      act(() => {
        realtimeCallbacks.insert?.({
          new: createNotificationRow({
            id: "notification-1",
          }),
        });
      });

      expect(
        result.current.notifications
      ).toHaveLength(1);
    });

    it("mantém no máximo 30 notificações", async () => {
      mocks.limit.mockResolvedValue({
        data: Array.from(
          {
            length: 30,
          },
          (_, index) =>
            createNotificationRow({
              id:
                `notification-${index + 1}`,
            })
        ),

        error: null,
      });

      const {
        result,
      } = renderUseNotifications();

      await waitFor(() => {
        expect(
          result.current.notifications
        ).toHaveLength(30);
      });

      await waitFor(() => {
        expect(
          realtimeCallbacks.insert
        ).toBeTypeOf("function");
      });

      act(() => {
        realtimeCallbacks.insert?.({
          new: createNotificationRow({
            id: "notification-new",
          }),
        });
      });

      expect(
        result.current.notifications
      ).toHaveLength(30);

      expect(
        result.current.notifications[0]
          .id
      ).toBe("notification-new");

      expect(
        result.current.notifications
          .some(
            notification =>
              notification.id ===
              "notification-30"
          )
      ).toBe(false);
    });

    it("não assina o canal quando não encontra o usuário", async () => {
      mocks.getUser.mockResolvedValue({
        data: {
          user: null,
        },

        error: null,
      });

      renderUseNotifications();

      await waitFor(() => {
        expect(
          mocks.getUser
        ).toHaveBeenCalledOnce();
      });

      expect(
        mocks.channelOn
      ).not.toHaveBeenCalled();

      expect(
        mocks.subscribe
      ).not.toHaveBeenCalled();
    });

    it("trata erro ao identificar o usuário", async () => {
      mocks.getUser.mockResolvedValue({
        data: {
          user: null,
        },

        error: {
          message:
            "Sessão inválida",
        },
      });

      renderUseNotifications();

      await waitFor(() => {
        expect(
          console.error
        ).toHaveBeenCalled();
      });

      expect(
        mocks.channelOn
      ).not.toHaveBeenCalled();
    });

    it("registra erro quando o canal falha", async () => {
      renderUseNotifications();

      await waitFor(() => {
        expect(
          realtimeCallbacks.status
        ).toBeTypeOf("function");
      });

      act(() => {
        realtimeCallbacks.status?.(
          "CHANNEL_ERROR"
        );
      });

      expect(
        console.error
      ).toHaveBeenCalledWith(
        "Erro no canal de notificações em tempo real."
      );
    });

    it("remove o canal ao desmontar o hook", async () => {
      const {
        unmount,
      } = renderUseNotifications();

      await waitFor(() => {
        expect(
          mocks.channel
        ).toHaveBeenCalled();
      });

      unmount();

      expect(
        mocks.removeChannel
      ).toHaveBeenCalledWith(
        channelObject
      );
    });
  }
);

describe(
  "useNotifications - marcar como lidas",
  () => {
    it("não atualiza o banco quando todas já estão lidas", async () => {
      mocks.limit.mockResolvedValue({
        data: [
          createNotificationRow({
            is_read: true,
          }),
        ],

        error: null,
      });

      const {
        result,
      } = renderUseNotifications();

      await waitFor(() => {
        expect(
          result.current.notifications
        ).toHaveLength(1);
      });

      await act(async () => {
        await result.current
          .handleMarkNotificationsAsRead();
      });

      expect(
        mocks.update
      ).not.toHaveBeenCalled();
    });

    it("envia somente os IDs das notificações não lidas", async () => {
      mocks.limit.mockResolvedValue({
        data: [
          createNotificationRow({
            id: "notification-1",
            is_read: false,
          }),

          createNotificationRow({
            id: "notification-2",
            is_read: true,
          }),

          createNotificationRow({
            id: "notification-3",
            is_read: false,
          }),
        ],

        error: null,
      });

      const {
        result,
      } = renderUseNotifications();

      await waitFor(() => {
        expect(
          result.current.notifications
        ).toHaveLength(3);
      });

      await act(async () => {
        await result.current
          .handleMarkNotificationsAsRead();
      });

      expect(
        mocks.update
      ).toHaveBeenCalledWith({
        is_read: true,
      });

      expect(
        mocks.updateIn
      ).toHaveBeenCalledWith(
        "id",
        [
          "notification-1",
          "notification-3",
        ]
      );
    });

    it("marca todas como lidas depois do sucesso", async () => {
      mocks.limit.mockResolvedValue({
        data: [
          createNotificationRow({
            id: "notification-1",
            is_read: false,
          }),

          createNotificationRow({
            id: "notification-2",
            is_read: false,
          }),
        ],

        error: null,
      });

      const {
        result,
      } = renderUseNotifications();

      await waitFor(() => {
        expect(
          result.current
            .unreadNotificationsCount
        ).toBe(2);
      });

      await act(async () => {
        await result.current
          .handleMarkNotificationsAsRead();
      });

      expect(
        result.current.notifications
          .every(
            notification =>
              notification.isRead
          )
      ).toBe(true);

      expect(
        result.current
          .unreadNotificationsCount
      ).toBe(0);
    });

    it("mantém as notificações não lidas quando o banco falha", async () => {
      mocks.updateIn.mockResolvedValue({
        error: {
          message:
            "Falha ao atualizar",
        },
      });

      const {
        result,
      } = renderUseNotifications();

      await waitFor(() => {
        expect(
          result.current
            .unreadNotificationsCount
        ).toBe(1);
      });

      await act(async () => {
        await result.current
          .handleMarkNotificationsAsRead();
      });

      expect(
        result.current
          .unreadNotificationsCount
      ).toBe(1);

      expect(
        result.current
          .notifications[0]
          .isRead
      ).toBe(false);

      expect(
        console.error
      ).toHaveBeenCalled();
    });
  }
);