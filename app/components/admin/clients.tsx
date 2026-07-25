"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "../../lib/supabase";

import {
  databasePrice,
  getInitials,
  money,
} from "../../lib/formatters";

import type {
  AppOrder,
  ClientProfileRow,
} from "../../types";

import { PanelHead } from "../ui";

export function Clients({
  orders,
}: {
  orders: AppOrder[];
}) {
  const [profiles, setProfiles] =
    useState<ClientProfileRow[]>([]);

  const [clientsLoading, setClientsLoading] =
    useState(true);

  const [clientsError, setClientsError] =
    useState("");

  useEffect(() => {
    let componentActive = true;

    async function loadClients() {
      setClientsLoading(true);
      setClientsError("");

      const {
        data,
        error,
      } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          phone,
          created_at
        `)
        .eq("role", "client")
        .order("created_at", {
          ascending: false,
        });

      if (!componentActive) {
        return;
      }

      if (error) {
        console.error(
          "Erro ao carregar clientes:",
          error
        );

        setClientsError(
          "Não foi possível carregar os clientes."
        );

        setClientsLoading(false);
        return;
      }

      setProfiles(
        (data || []) as ClientProfileRow[]
      );

      setClientsLoading(false);
    }

    loadClients();

    return () => {
      componentActive = false;
    };
  }, []);

  const clientList = useMemo(
    () =>
      profiles.map(profile => {
        const clientOrders = orders.filter(
          order =>
            order.userId === profile.id
        );

        const validOrders =
          clientOrders.filter(
            order =>
              order.statusCode !==
              "cancelled"
          );

        const paidOrders =
          clientOrders.filter(
            order =>
              order.paymentStatus === "paid"
          );

        const totalSpent =
          paidOrders.reduce(
            (total, order) =>
              total +
              databasePrice(order.value),
            0
          );

        return {
          id: profile.id,
          name: profile.full_name,
          initials: getInitials(
            profile.full_name
          ),
          phone:
            profile.phone ||
            "Telefone não informado",
          orders: validOrders.length,
          totalSpent,
          registeredAt:
            new Date(
              profile.created_at
            ).toLocaleDateString(
              "pt-BR"
            ),
        };
      }),
    [profiles, orders]
  );

  if (clientsLoading) {
    return (
      <div className="content">
        <section className="panel">
          <p>Carregando clientes...</p>
        </section>
      </div>
    );
  }

  if (clientsError) {
    return (
      <div className="content">
        <section className="panel">
          <p className="form-error">
            {clientsError}
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="content">
      <section className="panel full-table">
        <PanelHead
          icon="♙"
          title="Clientes"
          subtitle={`${clientList.length} cliente(s) cadastrado(s)`}
        />

        {clientList.length === 0 ? (
          <div className="empty-cart">
            <span>♙</span>

            <h3>
              Nenhum cliente encontrado
            </h3>

            <p>
              Os clientes aparecerão depois
              que criarem uma conta.
            </p>
          </div>
        ) : (
          <div className="client-grid">
            {clientList.map(client => (
              <article
                className="client"
                key={client.id}
              >
                <span className="initials large">
                  {client.initials}
                </span>

                <div>
                  <h3>{client.name}</h3>

                  <p>{client.phone}</p>

                  <small>
                    Cadastro em{" "}
                    {client.registeredAt}
                  </small>
                </div>

                <dl>
                  <div>
                    <dt>Pedidos ativos</dt>
                    <dd>{client.orders}</dd>
                  </div>

                  <div>
                    <dt>Total pago</dt>

                    <dd>
                      {money(
                        client.totalSpent
                      )}
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}