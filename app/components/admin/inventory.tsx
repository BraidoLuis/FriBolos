"use client";

import type { Product } from "../../types";

import {
  Kpi,
  PanelHead,
  ProductVisual,
} from "../ui";

export function Inventory({  products,  onStock,}: {  products: Product[];  onStock: (    id: Product["id"],    stock: number  ) => Promise<void>;}) {
  const low = products.filter(p => p.stock <= p.lowStock);
  return (
    <div className="content">
      <div className="kpis inventory-kpis">
        <Kpi icon="▦" label="Itens cadastrados" value={String(products.length)} note="Produtos ativos" tone="green" />
        <Kpi icon="!" label="Estoque baixo" value={String(low.length)} note="Requer atenção" tone="gold" />
        <Kpi icon="✓" label="Disponíveis" value={String(products.filter(p => p.stock > 0).length)} note="Prontos para venda" tone="green" />
      </div>
      <section className="panel inventory-panel">
        <PanelHead icon="▦" title="Controle de estoque" subtitle="Atualize as quantidades disponíveis" />
        <div className="inventory-list">
          {products.map(p => (
            <article key={p.id}>
              <ProductVisual product={p} />
              <div><small>{p.category}</small><b>{p.name}</b><span className={p.stock <= p.lowStock ? "stock-low" : "stock-ok"}>{p.stock === 0 ? "Sem estoque" : p.stock <= p.lowStock ? "Estoque baixo" : "Estoque normal"}</span></div>
              <div className="stock-control"><button onClick={() => onStock(p.id, Math.max(0, p.stock - 1))}>−</button><input aria-label={`Estoque de ${p.name}`} type="number" value={p.stock} onChange={e => onStock(p.id, Math.max(0, Number(e.target.value)))} /><button onClick={() => onStock(p.id, p.stock + 1)}>＋</button></div>
              <small>Alerta em {p.lowStock}</small>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
