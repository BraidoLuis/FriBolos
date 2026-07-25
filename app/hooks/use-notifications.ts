"use client";

import {
  useEffect,
  useState,
} from "react";

import { supabase } from "../lib/supabase";

import type {
  AppNotification,
  Role,
} from "../types";

type UseNotificationsOptions = {
  authLoading: boolean;
  role: Role | null;
};

export function useNotifications({
  authLoading,
  role,
}: UseNotificationsOptions) {
  const [
    notificationsOpen,
    setNotificationsOpen,
  ] = useState(false);

  const [
    notifications,
    setNotifications,
  ] = useState<AppNotification[]>([]);

  const [
    notificationsLoading,
    setNotificationsLoading,
  ] = useState(false);

  useEffect(() => {
    if (authLoading || !role) {
      const timer = window.setTimeout(
        () => {
          setNotifications([]);
        },
        0
      );

      return () => {
        window.clearTimeout(timer);
      };
    }

    let componentActive = true;

    async function loadNotifications() {
      setNotificationsLoading(true);

      const {
        data,
        error: notificationsError,
      } = await supabase
        .from("notifications")
        .select(`
          id,
          title,
          message,
          type,
          related_entity_type,
          related_entity_id,
          is_read,
          created_at
        `)
        .order("created_at", {
          ascending: false,
        })
        .limit(30);

      if (!componentActive) {
        return;
      }

      if (notificationsError) {
        console.error(
          "Erro ao carregar notificações:",
          notificationsError
        );

        setNotifications([]);
        setNotificationsLoading(false);
        return;
      }

      const mappedNotifications:
        AppNotification[] = (
        data || []
      ).map(notification => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,

        relatedEntityType:
          notification.related_entity_type,

        relatedEntityId:
          notification.related_entity_id,

        isRead: notification.is_read,
        createdAt: notification.created_at,
      }));

      setNotifications(
        mappedNotifications
      );

      setNotificationsLoading(false);
    }

    loadNotifications();

    return () => {
      componentActive = false;
    };
  }, [authLoading, role]);

  useEffect(() => {
    if (authLoading || !role) {
      return;
    }

    let componentActive = true;

    const channel = supabase.channel(
      `notifications-${crypto.randomUUID()}`
    );

    async function subscribeToNotifications() {
      const {
        data: userData,
        error: userError,
      } = await supabase.auth.getUser();

      if (
        !componentActive ||
        userError ||
        !userData.user
      ) {
        if (userError) {
          console.error(
            "Erro ao identificar usuário das notificações:",
            userError
          );
        }

        return;
      }

      channel
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",

            filter:
              `user_id=eq.${userData.user.id}`,
          },
          payload => {
            const row = payload.new as {
              id: string;
              title: string;
              message: string;
              type: string;

              related_entity_type:
                | string
                | null;

              related_entity_id:
                | string
                | null;

              is_read: boolean;
              created_at: string;
            };

            const newNotification:
              AppNotification = {
              id: row.id,
              title: row.title,
              message: row.message,
              type: row.type,

              relatedEntityType:
                row.related_entity_type,

              relatedEntityId:
                row.related_entity_id,

              isRead: row.is_read,
              createdAt: row.created_at,
            };

            setNotifications(current => {
              const alreadyExists =
                current.some(
                  notification =>
                    notification.id ===
                    newNotification.id
                );

              if (alreadyExists) {
                return current;
              }

              return [
                newNotification,
                ...current,
              ].slice(0, 30);
            });
          }
        )
        .subscribe(status => {
          if (
            status === "CHANNEL_ERROR"
          ) {
            console.error(
              "Erro no canal de notificações em tempo real."
            );
          }
        });
    }

    subscribeToNotifications();

    return () => {
      componentActive = false;

      supabase.removeChannel(channel);
    };
  }, [authLoading, role]);

  async function handleMarkNotificationsAsRead() {
    const unreadIds = notifications
      .filter(
        notification =>
          !notification.isRead
      )
      .map(
        notification =>
          notification.id
      );

    if (unreadIds.length === 0) {
      return;
    }

    const {
      error: updateError,
    } = await supabase
      .from("notifications")
      .update({
        is_read: true,
      })
      .in("id", unreadIds);

    if (updateError) {
      console.error(
        "Erro ao marcar notificações como lidas:",
        updateError
      );

      return;
    }

    setNotifications(current =>
      current.map(notification => ({
        ...notification,
        isRead: true,
      }))
    );
  }

  const unreadNotificationsCount =
    notifications.filter(
      notification =>
        !notification.isRead
    ).length;

  return {
    notificationsOpen,
    setNotificationsOpen,
    notifications,
    notificationsLoading,
    unreadNotificationsCount,
    handleMarkNotificationsAsRead,
  };
}