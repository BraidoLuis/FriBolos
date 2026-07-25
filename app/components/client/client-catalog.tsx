"use client";

import { useState } from "react";

import type { Product } from "../../types";

import { ProductVisual } from "../ui";

export function ClientCatalog({ products, onChoose, onAdd }: { products: Product[]; onChoose: (p: Product) => void; onAdd: (p: Product) => void }) {
  const [category, setCategory] = useState("Todos");
  const categories = ["Todos", ...Array.from(new Set(products.map(p => p.category)))];
  const list = category === "Todos" ? products : products.filter(p => p.category === category);
  const visible = [...list].sort((a, b) => (Number(b.featured) - Number(a.featured)) || (a.featuredOrder - b.featuredOrder));
  return (
    <>
      <div className="catalog-hero"><p className="eyebrow">NOSSO CARDÁPIO</p><h1>Feitos à mão,<br />pensados para você.</h1><span>Adicione quantos produtos quiser e finalize tudo no carrinho.</span></div>
      <div className="catalog-filters">{categories.map(c => <button key={c} className={category === c ? "active" : ""} onClick={() => setCategory(c)}>{c}</button>)}</div>
      <div className="client-catalog-grid">
        {visible.map(p => (
          <article className={`catalog-card ${p.stock === 0 ? "sold-out" : ""}`} key={p.id}>
            <ProductVisual product={p} />
            <div>
              <small>{p.category}{p.featured ? " • DESTAQUE" : ""}</small>
              <h2>{p.name}</h2>
              <p>{p.description}</p>
              <div className="catalog-meta"><span>◷ {p.preparation}</span><span>{p.stock === 0 ? "Indisponível" : `Disponível: ${p.stock}`}</span></div>
              <footer>
                <div><small>A partir de</small><strong>{p.price}</strong></div>
                <div className="catalog-actions">
                  {p.customizable && <button className="customize-product" onClick={() => onChoose(p)}>Personalizar</button>}
                  <button disabled={p.stock === 0} onClick={() => onAdd(p)}>{p.stock === 0 ? "Esgotado" : "＋ Carrinho"}</button>
                </div>
              </footer>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}