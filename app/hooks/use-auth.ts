"use client";

import {
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import { supabase } from "../lib/supabase";

import type {
  Role,
  UserProfile,
} from "../types";

type UseAuthOptions = {
  setToast: Dispatch<
    SetStateAction<string>
  >;

  onLogoutSuccess?: () => void;
};

export function useAuth({
  setToast,
  onLogoutSuccess,
}: UseAuthOptions) {
  const [role, setRole] =
    useState<Role | null>(null);

  const [profile, setProfile] =
    useState<UserProfile | null>(null);

  const [authLoading, setAuthLoading] =
    useState(true);

  const [
    passwordRecovery,
    setPasswordRecovery,
  ] = useState(false);

  const showToast = useCallback(
    (
      message: string,
      duration = 2800
    ) => {
      setToast(message);

      window.setTimeout(() => {
        setToast("");
      }, duration);
    },
    [setToast]
  );

  useEffect(() => {
    let componentActive = true;

    async function restoreSession() {
      try {
        const {
          data: { session },
          error: sessionError,
        } =
          await supabase.auth.getSession();

        if (!componentActive) {
          return;
        }

        if (sessionError) {
          console.error(
            "Erro ao recuperar sessão:",
            sessionError
          );

          setRole(null);
          setProfile(null);
          return;
        }

        if (!session?.user) {
          setRole(null);
          setProfile(null);
          return;
        }

        const {
          data: profileData,
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
          .eq("id", session.user.id)
          .single();

        if (!componentActive) {
          return;
        }

        if (
          profileError ||
          !profileData
        ) {
          console.error(
            "Erro ao recuperar perfil:",
            profileError
          );

          await supabase.auth.signOut();

          setRole(null);
          setProfile(null);
          return;
        }

        if (
          profileData.role !== "admin" &&
          profileData.role !== "client"
        ) {
          await supabase.auth.signOut();

          setRole(null);
          setProfile(null);
          return;
        }

        const profileRole =
          profileData.role as Role;

        setRole(profileRole);

        setProfile({
          ...profileData,
          role: profileRole,
          email:
            session.user.email || "",
        });
      } catch (connectionError) {
        console.error(
          "Erro ao restaurar a sessão:",
          connectionError
        );

        setRole(null);
        setProfile(null);
      } finally {
        if (componentActive) {
          setAuthLoading(false);
        }
      }
    }

    void restoreSession();

    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        (event, session) => {
          if (
            event ===
            "PASSWORD_RECOVERY"
          ) {
            setPasswordRecovery(true);
            setAuthLoading(false);
            return;
          }

          if (!session) {
            setRole(null);
            setProfile(null);
            setAuthLoading(false);
          }
        }
      );

    return () => {
      componentActive = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogin = useCallback(
    (userProfile: UserProfile) => {
      setProfile(userProfile);
      setRole(userProfile.role);
    },
    []
  );

  const completePasswordRecovery =
    useCallback(() => {
      setPasswordRecovery(false);
      setRole(null);
      setProfile(null);
    }, []);

  const handleLogout =
    useCallback(async () => {
      sessionStorage.removeItem(
        "fribolos-client-section"
      );

      sessionStorage.removeItem(
        "fribolos-admin-screen"
      );

      const {
        error: logoutError,
      } =
        await supabase.auth.signOut();

      if (logoutError) {
        console.error(
          "Erro ao sair da conta:",
          logoutError
        );

        showToast(
          "Não foi possível sair da conta. Tente novamente."
        );

        return;
      }

      setRole(null);
      setProfile(null);
      onLogoutSuccess?.();
    }, [
      onLogoutSuccess,
      showToast,
    ]);

  return {
    role,
    profile,
    setProfile,
    authLoading,
    passwordRecovery,
    handleLogin,
    handleLogout,
    completePasswordRecovery,
  };
}