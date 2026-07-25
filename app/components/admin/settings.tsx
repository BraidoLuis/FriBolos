"use client";

import type {
  StoreSettings,
} from "../../types";

const weekdayOptions = [
  { value: 0, label: "Dom" },
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
];

export function Settings({
  settings,
  loading,
  saving,
  onSave,
}: {
  settings: StoreSettings | null;
  loading: boolean;
  saving: boolean;
  onSave: (
    e: React.FormEvent<HTMLFormElement>
  ) => Promise<void>;
}) {
  if (loading) {
    return (
      <div className="content">
        <section className="panel settings">
          <div className="empty-cart">
            <span>◌</span>
            <h3>Carregando configurações...</h3>
          </div>
        </section>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="content">
        <section className="panel settings">
          <div className="empty-cart">
            <span>⚙</span>
            <h3>
              Configurações não encontradas
            </h3>

            <p>
              Não foi possível carregar os dados da
              confeitaria.
            </p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="content">
      <form
        key={settings.updated_at}
        className="panel settings"
        onSubmit={onSave}
      >
        <div className="panel-head">
          <span>⚙</span>

          <div>
            <p className="eyebrow">
              CONFIGURAÇÕES
            </p>

            <h2>Dados da confeitaria</h2>

            <p>
              Informações usadas nos pedidos,
              contatos e relatórios.
            </p>
          </div>
        </div>

        <div className="form-grid">
          <label>
            Nome da confeitaria

            <input
              required
              name="storeName"
              defaultValue={settings.store_name}
              placeholder="Nome da confeitaria"
            />
          </label>

          <label>
            CNPJ

            <input
              name="cnpj"
              defaultValue={settings.cnpj || ""}
              placeholder="00.000.000/0000-00"
            />
          </label>

          <label className="wide">
            Descrição

            <textarea
              name="description"
              defaultValue={
                settings.description || ""
              }
              placeholder="Uma breve descrição da confeitaria"
            />
          </label>

          <label>
            E-mail de contato

            <input
              name="contactEmail"
              type="email"
              defaultValue={
                settings.contact_email || ""
              }
              placeholder="contato@fribolos.com.br"
            />
          </label>

          <label>
            WhatsApp

            <input
              name="whatsapp"
              defaultValue={
                settings.whatsapp || ""
              }
              placeholder="(22) 99999-9999"
            />
          </label>

          <label>
            Instagram

            <input
              name="instagram"
              defaultValue={
                settings.instagram || ""
              }
              placeholder="@fribolos"
            />
          </label>

          <label>
            CEP

            <input
              name="zipCode"
              defaultValue={
                settings.zip_code || ""
              }
              placeholder="00000-000"
            />
          </label>

          <label className="wide">
            Endereço

            <input
              name="address"
              defaultValue={
                settings.address || ""
              }
              placeholder="Rua, número e bairro"
            />
          </label>

          <label>
            Cidade

            <input
              name="city"
              defaultValue={
                settings.city || ""
              }
              placeholder="Cidade"
            />
          </label>

          <label>
            Estado

            <input
              name="state"
              maxLength={2}
              defaultValue={
                settings.state || ""
              }
              placeholder="RJ"
            />
          </label>

          <label>
            Horário de abertura

            <input
              name="openingTime"
              type="time"
              defaultValue={
                settings.opening_time
                  ? settings.opening_time.slice(
                      0,
                      5
                    )
                  : ""
              }
            />
          </label>

          <label>
            Horário de encerramento

            <input
              name="closingTime"
              type="time"
              defaultValue={
                settings.closing_time
                  ? settings.closing_time.slice(
                      0,
                      5
                    )
                  : ""
              }
            />
          </label>

          <div className="wide settings-weekdays">
            <strong>Dias de funcionamento</strong>

            <div>
              {weekdayOptions.map(day => (
                <label key={day.value}>
                  <input
                    type="checkbox"
                    name="businessWeekdays"
                    value={day.value}
                    defaultChecked={
                    (settings.business_weekdays || []).includes(
                      day.value
                    )
                    }
                  />

                  <span>{day.label}</span>
                </label>
              ))}
            </div>

            <small>
              Selecione os dias em que a confeitaria
              recebe pedidos.
            </small>
          </div>

          <label>
            Pedido mínimo

            <input
              name="minimumOrderValue"
              type="number"
              min="0"
              step="0.01"
              defaultValue={
                settings.minimum_order_value
              }
            />
          </label>

          <label>
            Taxa de entrega

            <input
              name="deliveryFee"
              type="number"
              min="0"
              step="0.01"
              defaultValue={
                settings.delivery_fee
              }
            />
          </label>
          
          <label className="wide settings-toggle">
            <input
              name="acceptsOrders"
              type="checkbox"
              defaultChecked={
                settings.accepts_orders
              }
            />

            <span className="settings-toggle-control">
              <i />
            </span>

            <span className="settings-toggle-copy">
              <strong>
                Aceitar novos pedidos
              </strong>

              <small>
                Quando desativado, novos pedidos ficam
                temporariamente indisponíveis.
              </small>
            </span>
          </label>
        </div>

        <button
          className="primary"
          type="submit"
          disabled={saving}
        >
          {saving
            ? "Salvando alterações..."
            : "Salvar alterações"}
        </button>
      </form>
    </div>
  );
}
