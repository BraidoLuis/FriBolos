"use client";

import type { Product } from "../types";

export function Status({
  children,
}: {
  children: string;
}) {
  const className = children
    .toLowerCase()
    .replace(" ", "-")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return (
    <span className={`status ${className}`}>
      <i />
      {children}
    </span>
  );
}

export function Kpi({
  icon,
  label,
  value,
  note,
  tone,
}: {
  icon: string;
  label: string;
  value: string;
  note: string;
  tone: string;
}) {
  return (
    <article className="kpi">
      <span className="kpi-icon">
        {icon}
      </span>

      <div>
        <small>{label}</small>
        <strong>{value}</strong>

        <em className={tone}>
          {note}
        </em>
      </div>
    </article>
  );
}

export function PanelHead({
  icon,
  title,
  subtitle,
  action,
  onClick,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  action?: string;
  onClick?: () => void;
}) {
  return (
    <div className="panel-head">
      <span>{icon}</span>

      <div>
        <h2>{title}</h2>

        {subtitle && (
          <strong>{subtitle}</strong>
        )}
      </div>

      {action && (
        <button
          type="button"
          onClick={onClick}
        >
          {action} ›
        </button>
      )}
    </div>
  );
}

export function ProductVisual({
  product,
}: {
  product: Product;
}) {
  const fallback: Record<
    string,
    string
  > = {
    Bolos: "🍰",
    Tortas: "🥧",
    Doces: "🍫",
    Salgados: "🥐",
    Kits: "🎂",
    Outros: "🧁",
  };

  return (
    <div className="product-img">
      {product.image ? (
        <img
          src={product.image}
          alt={product.name}
        />
      ) : (
        fallback[product.category] ||
        "🧁"
      )}
    </div>
  );
}