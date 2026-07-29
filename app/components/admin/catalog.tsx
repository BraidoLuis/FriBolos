"use client";

import {
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import { supabase } from "../../lib/supabase";

import { databasePrice } from "../../lib/formatters";

import {
  getNextFeaturedOrder,
  getProductImagePath,
} from "../../lib/product-utils";

import type {
  Product,
  ProductRow,
} from "../../types";

import { mapProduct } from "../../lib/mappers";

import { ProductVisual } from "../ui";

export function Catalog({ products, onChange, onToast }: { products: Product[]; onChange: (p: Product[]) => void; onToast: (m: string) => void }) {
  const [editing, setEditing] =
    useState<Product | null>(null);

  const [open, setOpen] = useState(false);
  const [image, setImage] = useState("");
  const [imageFile, setImageFile] =
    useState<File | null>(null);

  const [saving, setSaving] = useState(false);
  const [
    updatingProductId,
    setUpdatingProductId,
  ] = useState<Product["id"] | null>(null);
  function startEdit(product?: Product) {
    setEditing(product || null);
    setImage(product?.image || "");
    setImageFile(null);
    setOpen(true);
  }

  function handleImage(
    e: ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    setImageFile(file);

    const reader = new FileReader();

    reader.onload = () => {
      setImage(String(reader.result));
    };

    reader.readAsDataURL(file);
  }
  
  async function toggleProductVisibility(
    product: Product
  ) {
    const newActiveStatus = !product.active;

    setUpdatingProductId(product.id);

    try {
      const {
        error: updateError,
      } = await supabase
        .from("products")
        .update({
          is_active: newActiveStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", product.id);

      if (updateError) {
        console.error(
          "Erro ao alterar publicação:",
          updateError
        );

        onToast(
          "Não foi possível alterar a publicação."
        );

        return;
      }

      onChange(
        products.map(currentProduct =>
          currentProduct.id === product.id
            ? {
                ...currentProduct,
                active: newActiveStatus,
              }
            : currentProduct
        )
      );

      onToast(
        newActiveStatus
          ? "Produto publicado com sucesso!"
          : "Produto ocultado do catálogo!"
      );
    } catch (error) {
      console.error(
        "Erro inesperado ao alterar publicação:",
        error
      );

      onToast(
        "Ocorreu um erro ao alterar a publicação."
      );
    } finally {
      setUpdatingProductId(null);
    }
  }

  async function setProductArchived(
    product: Product,
    archived: boolean
  ) {
    setUpdatingProductId(product.id);

    const newActiveStatus = archived
      ? false
      : product.active;

    try {
      const {
        error: updateError,
      } = await supabase
        .from("products")
        .update({
          is_archived: archived,
          is_active: newActiveStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", product.id);

      if (updateError) {
        console.error(
          "Erro ao alterar arquivamento:",
          updateError
        );

        onToast(
          "Não foi possível alterar o arquivamento."
        );

        return;
      }

      onChange(
        products.map(currentProduct =>
          currentProduct.id === product.id
            ? {
                ...currentProduct,
                archived,
                active: newActiveStatus,
              }
            : currentProduct
        )
      );

      onToast(
        archived
          ? "Produto arquivado com sucesso!"
          : "Produto restaurado com sucesso!"
      );
    } catch (error) {
      console.error(
        "Erro inesperado no arquivamento:",
        error
      );

      onToast(
        "Ocorreu um erro ao alterar o arquivamento."
      );
    } finally {
      setUpdatingProductId(null);
    }
  }

  async function deleteProduct(
    product: Product
  ) {
    const confirmed = window.confirm(
      `Excluir definitivamente "${product.name}"?\n\nEssa ação não poderá ser desfeita.`
    );

    if (!confirmed) {
      return;
    }

    setUpdatingProductId(product.id);

    try {
      const {
        error: deleteError,
      } = await supabase
        .from("products")
        .delete()
        .eq("id", product.id);

      if (deleteError) {
        console.error(
          "Erro ao excluir produto:",
          deleteError
        );

        onToast(
          "Não foi possível excluir o produto."
        );

        return;
      }

      /*
      * Depois de excluir o produto,
      * remove sua imagem do Storage.
      */
      if (product.image) {
        const imagePath =
          getProductImagePath(product.image);

        if (imagePath) {
          const {
            error: imageError,
          } = await supabase.storage
            .from("product-images")
            .remove([imagePath]);

          if (imageError) {
            console.error(
              "Produto excluído, mas a imagem não foi removida:",
              imageError
            );
          }
        }
      }

      onChange(
        products.filter(
          currentProduct =>
            currentProduct.id !== product.id
        )
      );

      onToast("Produto excluído definitivamente!");
    } catch (error) {
      console.error(
        "Erro inesperado ao excluir produto:",
        error
      );

      onToast(
        "Ocorreu um erro ao excluir o produto."
      );
    } finally {
      setUpdatingProductId(null);
    }
  }

  async function duplicateProduct(
    product: Product
  ) {
    setUpdatingProductId(product.id);

    let copiedImagePath = "";
    let copiedImageUrl: string | null = null;

    try {
      /*
      * Cria uma cópia independente da imagem.
      */
      if (product.image) {
        const originalImagePath =
          getProductImagePath(product.image);

        if (originalImagePath) {
          const extension =
            originalImagePath
              .split(".")
              .pop()
              ?.toLowerCase() || "jpg";

          copiedImagePath =
            `products/${crypto.randomUUID()}.${extension}`;

          const {
            error: copyError,
          } = await supabase.storage
            .from("product-images")
            .copy(
              originalImagePath,
              copiedImagePath
            );

          if (copyError) {
            console.error(
              "Erro ao copiar imagem:",
              copyError
            );

            onToast(
              "Não foi possível copiar a imagem."
            );

            return;
          }

          const {
            data: publicImageData,
          } = supabase.storage
            .from("product-images")
            .getPublicUrl(copiedImagePath);

          copiedImageUrl =
            publicImageData.publicUrl;
        }
      }

      const {
        data: duplicatedRow,
        error: duplicateError,
      } = await supabase
        .from("products")
        .insert({
          name: `${product.name} — cópia`,
          category: product.category,
          price: databasePrice(product.price),
          description: product.description,
          image_url: copiedImageUrl,
          preparation_time: product.preparation,
          minimum_order: product.minimum,
          stock_quantity: product.stock,
          low_stock_limit: product.lowStock,
          is_active: false,
          is_archived: false,
          is_featured: false,
          featured_order: null,
          is_customizable:
            product.customizable,
        })
        .select(`
          id,
          name,
          category,
          price,
          description,
          image_url,
          preparation_time,
          minimum_order,
          stock_quantity,
          low_stock_limit,
          is_active,
          is_archived,
          is_featured,
          featured_order,
          is_customizable
        `)
        .single();

      if (duplicateError || !duplicatedRow) {
        console.error(
          "Erro ao duplicar produto:",
          duplicateError
        );

        if (copiedImagePath) {
          await supabase.storage
            .from("product-images")
            .remove([copiedImagePath]);
        }

        onToast(
          "Não foi possível duplicar o produto."
        );

        return;
      }

      /*
      * Duplica as opções de personalização.
      */
      if (product.options.length > 0) {
        const {
          error: optionsError,
        } = await supabase
          .from("product_options")
          .insert(
            product.options.map(optionName => ({
              product_id: duplicatedRow.id,
              option_name: optionName,
              option_value: "A combinar",
              additional_price: 0,
              is_active: true,
            }))
          );

        if (optionsError) {
          console.error(
            "Erro ao duplicar opções:",
            optionsError
          );

          await supabase
            .from("products")
            .delete()
            .eq("id", duplicatedRow.id);

          if (copiedImagePath) {
            await supabase.storage
              .from("product-images")
              .remove([copiedImagePath]);
          }

          onToast(
            "Não foi possível duplicar as personalizações."
          );

          return;
        }
      }

      const duplicatedProduct: Product = {
        ...mapProduct(
          duplicatedRow as ProductRow
        ),
        options: [...product.options],
      };

      onChange([
        duplicatedProduct,
        ...products,
      ]);

      onToast(
        "Produto duplicado como oculto!"
      );
    } catch (error) {
      console.error(
        "Erro inesperado ao duplicar produto:",
        error
      );

      if (copiedImagePath) {
        await supabase.storage
          .from("product-images")
          .remove([copiedImagePath]);
      }

      onToast(
        "Ocorreu um erro ao duplicar o produto."
      );
    } finally {
      setUpdatingProductId(null);
    }
  }

  async function moveFeaturedProduct(
    product: Product,
    direction: -1 | 1
  ) {
    const featuredProducts = products
      .filter(
        currentProduct =>
          currentProduct.featured &&
          !currentProduct.archived
      )
      .sort(
        (first, second) =>
          first.featuredOrder -
          second.featuredOrder
      );

    const currentIndex =
      featuredProducts.findIndex(
        currentProduct =>
          currentProduct.id === product.id
      );

    const targetIndex =
      currentIndex + direction;

    if (
      currentIndex === -1 ||
      targetIndex < 0 ||
      targetIndex >= featuredProducts.length
    ) {
      return;
    }

    const targetProduct =
      featuredProducts[targetIndex];

    setUpdatingProductId(product.id);

    try {
      const {
        error: moveError,
      } = await supabase.rpc(
        "move_featured_product",
        {
          p_product_id: product.id,
          p_direction: direction,
        }
      );

      if (moveError) {
        console.error(
          "Erro ao reorganizar destaques:",
          moveError
        );

        onToast(
          "Não foi possível reorganizar os destaques."
        );

        return;
      }

      onChange(
        products.map(currentProduct => {
          if (currentProduct.id === product.id) {
            return {
              ...currentProduct,
              featuredOrder:
                targetProduct.featuredOrder,
            };
          }

          if (
            currentProduct.id ===
            targetProduct.id
          ) {
            return {
              ...currentProduct,
              featuredOrder:
                product.featuredOrder,
            };
          }

          return currentProduct;
        })
      );

      onToast(
        "Ordem dos destaques atualizada!"
      );
    } catch (error) {
      console.error(
        "Erro inesperado ao reorganizar:",
        error
      );

      onToast(
        "Ocorreu um erro ao reorganizar os destaques."
      );
    } finally {
      setUpdatingProductId(null);
    }
  }

  async function updateExistingProduct(
    data: FormData,
    price: number
  ) {
    if (!editing) {
      return;
    }

    setSaving(true);

    let newImagePath = "";
    let imageUrl = editing.image;

    try {
      /*
      * Se uma nova foto foi selecionada,
      * envia antes de atualizar o produto.
      */
      if (imageFile) {
        const extension =
          imageFile.name
            .split(".")
            .pop()
            ?.toLowerCase() || "jpg";

        newImagePath =
          `products/${crypto.randomUUID()}.${extension}`;

        const {
          error: uploadError,
        } = await supabase.storage
          .from("product-images")
          .upload(newImagePath, imageFile, {
            cacheControl: "3600",
            upsert: false,
            contentType: imageFile.type,
          });

        if (uploadError) {
          console.error(
            "Erro ao enviar nova imagem:",
            uploadError
          );

          onToast(
            "Não foi possível enviar a nova imagem."
          );

          return;
        }

        const {
          data: publicImageData,
        } = supabase.storage
          .from("product-images")
          .getPublicUrl(newImagePath);

        imageUrl = publicImageData.publicUrl;
      }

      const optionNames = data
        .getAll("options")
        .map(option =>
          String(option).trim()
        )
        .filter(Boolean);

      const isFeatured =
        data.get("featured") === "on";

      const {
        data: updatedRow,
        error: updateError,
      } = await supabase
        .from("products")
        .update({
          name: String(
            data.get("name") || ""
          ).trim(),
          category: String(
            data.get("category") || ""
          ),
          price,
          description: String(
            data.get("description") || ""
          ).trim(),
          image_url: imageUrl || null,
          preparation_time: String(
            data.get("preparation") || ""
          ).trim(),
          minimum_order: String(
            data.get("minimum") || ""
          ).trim(),
          stock_quantity:
            Number(data.get("stock")) || 0,
          low_stock_limit:
            Number(data.get("lowStock")) || 0,
          is_active:
            data.get("active") === "on",
          is_archived: editing.archived,
          is_featured: isFeatured,
          featured_order: isFeatured
            ? editing.featured &&
              editing.featuredOrder > 0
              ? editing.featuredOrder
              : getNextFeaturedOrder(products)
            : null,
          is_customizable:
            data.get("customizable") === "on",
          updated_at: new Date().toISOString(),
        })
        .eq("id", editing.id)
        .select(`
          id,
          name,
          category,
          price,
          description,
          image_url,
          preparation_time,
          minimum_order,
          stock_quantity,
          low_stock_limit,
          is_active,
          is_archived,
          is_featured,
          featured_order,
          is_customizable
        `)
        .single();

      if (updateError || !updatedRow) {
        console.error(
          "Erro ao atualizar produto:",
          updateError
        );

        if (newImagePath) {
          await supabase.storage
            .from("product-images")
            .remove([newImagePath]);
        }

        onToast(
          "Não foi possível atualizar o produto."
        );

        return;
      }

      /*
      * Remove as opções antigas.
      */
      const {
        error: deleteOptionsError,
      } = await supabase
        .from("product_options")
        .delete()
        .eq("product_id", editing.id);

      if (deleteOptionsError) {
        console.error(
          "Erro ao remover opções antigas:",
          deleteOptionsError
        );

        onToast(
          "O produto foi atualizado, mas ocorreu um erro nas personalizações."
        );

        return;
      }

      /*
      * Cadastra novamente as opções informadas.
      */
      if (optionNames.length > 0) {
        const {
          error: optionsError,
        } = await supabase
          .from("product_options")
          .insert(
            optionNames.map(optionName => ({
              product_id: editing.id,
              option_name: optionName,
              option_value: "A combinar",
              additional_price: 0,
              is_active: true,
            }))
          );

        if (optionsError) {
          console.error(
            "Erro ao atualizar personalizações:",
            optionsError
          );

          onToast(
            "O produto foi atualizado, mas não foi possível salvar as personalizações."
          );

          return;
        }
      }

      /*
      * A nova imagem funcionou.
      * Agora podemos remover a antiga.
      */
      if (
        imageFile &&
        editing.image &&
        editing.image !== imageUrl
      ) {
        const oldImagePath =
          getProductImagePath(editing.image);

        if (oldImagePath) {
          const {
            error: removeImageError,
          } = await supabase.storage
            .from("product-images")
            .remove([oldImagePath]);

          if (removeImageError) {
            console.error(
              "Produto atualizado, mas a imagem antiga não foi removida:",
              removeImageError
            );
          }
        }
      }

      const updatedProduct: Product = {
        ...mapProduct(
          updatedRow as ProductRow
        ),
        options: optionNames,
      };

      onChange(
        products.map(product =>
          product.id === editing.id
            ? updatedProduct
            : product
        )
      );

      setEditing(null);
      setImage("");
      setImageFile(null);
      setOpen(false);

      onToast("Produto atualizado com sucesso!");
    } catch (error) {
      console.error(
        "Erro inesperado ao editar produto:",
        error
      );

      if (newImagePath) {
        await supabase.storage
          .from("product-images")
          .remove([newImagePath]);
      }

      onToast(
        "Ocorreu um erro ao editar o produto."
      );
    } finally {
      setSaving(false);
    }
  }

  async function submit(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    const form = e.currentTarget;
    const data = new FormData(form);

    const price = databasePrice(
      String(data.get("price") || "")
    );

    if (!Number.isFinite(price) || price <= 0) {
      onToast("Informe um preço válido.");
      return;
    }

    if (editing) {
      await updateExistingProduct(data, price);
      return;
    }

    if (!imageFile) {
      onToast("Selecione uma foto para o produto.");
      return;
    }

    setSaving(true);

    let uploadedImagePath = "";

    try {
      const fileExtension =
        imageFile.name.split(".").pop()?.toLowerCase() ||
        "jpg";

      uploadedImagePath =
        `products/${crypto.randomUUID()}.${fileExtension}`;

      const {
        error: uploadError,
      } = await supabase.storage
        .from("product-images")
        .upload(uploadedImagePath, imageFile, {
          cacheControl: "3600",
          upsert: false,
          contentType: imageFile.type,
        });

      if (uploadError) {
        console.error(
          "Erro ao enviar imagem:",
          uploadError
        );

        onToast(
          "Não foi possível enviar a imagem."
        );

        return;
      }

      const {
        data: publicImageData,
      } = supabase.storage
        .from("product-images")
        .getPublicUrl(uploadedImagePath);

      const options = data
        .getAll("options")
        .map(option =>
          String(option).trim()
        )
        .filter(Boolean);

      const isFeatured =
        data.get("featured") === "on";

      const {
        data: createdProduct,
        error: productError,
      } = await supabase
        .from("products")
        .insert({
          name: String(data.get("name") || "").trim(),
          category: String(
            data.get("category") || ""
          ),
          price,
          description: String(
            data.get("description") || ""
          ).trim(),
          image_url: publicImageData.publicUrl,
          preparation_time: String(
            data.get("preparation") || ""
          ).trim(),
          minimum_order: String(
            data.get("minimum") || ""
          ).trim(),
          stock_quantity:
            Number(data.get("stock")) || 0,
          low_stock_limit:
            Number(data.get("lowStock")) || 0,
          is_active: data.get("active") === "on",
          is_archived: false,
          is_featured: isFeatured,
          featured_order: isFeatured
            ? getNextFeaturedOrder(products)
            : null,
          is_customizable:
            data.get("customizable") === "on",
        })
        .select(`
          id,
          name,
          category,
          price,
          description,
          image_url,
          preparation_time,
          minimum_order,
          stock_quantity,
          low_stock_limit,
          is_active,
          is_archived,
          is_featured,
          featured_order,
          is_customizable
        `)
        .single();

      if (productError || !createdProduct) {
        console.error(
          "Erro ao cadastrar produto:",
          productError
        );

        await supabase.storage
          .from("product-images")
          .remove([uploadedImagePath]);

        onToast(
          "Não foi possível cadastrar o produto."
        );

        return;
      }

      if (options.length > 0) {
      const {
        error: optionsError,
      } = await supabase
        .from("product_options")
        .insert(
          options.map(optionName => ({
            product_id: createdProduct.id,
            option_name: optionName,
            option_value: "A combinar",
            additional_price: 0,
            is_active: true,
          }))
        );

      if (optionsError) {
        console.error(
          "Erro ao cadastrar personalizações:",
          optionsError
        );

        await supabase
          .from("products")
          .delete()
          .eq("id", createdProduct.id);

        await supabase.storage
          .from("product-images")
          .remove([uploadedImagePath]);

        onToast(
          "Não foi possível cadastrar as personalizações."
        );

        return;
      }
    }

      const product = {
        ...mapProduct(
          createdProduct as ProductRow
        ),
        options,
      };

      onChange([product, ...products]);

      setOpen(false);
      setImage("");
      setImageFile(null);

      onToast("Produto publicado com sucesso!");
    } catch (error) {
      console.error(
        "Erro inesperado ao cadastrar produto:",
        error
      );

      if (uploadedImagePath) {
        await supabase.storage
          .from("product-images")
          .remove([uploadedImagePath]);
      }

      onToast(
        "Ocorreu um erro ao cadastrar o produto."
      );
    } finally {
      setSaving(false);
    }
  }
  const visible = products.filter(p => !p.archived);
  const orderedFeaturedProducts = products
    .filter(
      product =>
        product.featured &&
        !product.archived
    )
    .sort(
      (first, second) =>
        first.featuredOrder -
        second.featuredOrder
    );
  return (
    <div className="content">
      <div className="page-actions">
        <div><h2 className="section-title">Produtos do catálogo</h2><p className="section-subtitle">{visible.filter(p => p.active).length} publicados • {products.filter(p => p.archived).length} arquivados</p></div>
        <button className="new-order" onClick={() => startEdit()}>＋ Adicionar produto</button>
      </div>
      <div className="product-grid">
        {visible.map(p => (
          <article className={`product admin-product ${!p.active ? "disabled" : ""}`} key={p.id}>
            <ProductVisual product={p} />
            <div className="product-body">
              <div className="product-topline"><small>{p.category}</small>{p.featured && <span>Destaque #{p.featuredOrder}</span>}</div>
              <h3>{p.name}</h3>
              <p>{p.description}</p>
              <div className="product-meta"><span>◷ {p.preparation}</span><span>{p.stock} em estoque</span>{p.customizable && <span>Personalizável</span>}</div>
              <div className="product-bottom"><strong>{p.price}</strong><button  className={    p.active ? "published" : "draft"  }  disabled={updatingProductId === p.id}  onClick={() =>    toggleProductVisibility(p)  }>  {updatingProductId === p.id    ? "Atualizando..."    : p.active      ? "Publicado"      : "Oculto"}</button></div>
              <div className="product-admin-actions">
                <button onClick={() => startEdit(p)}>Editar</button>
                <button  disabled={updatingProductId === p.id}  onClick={() => duplicateProduct(p)}>  {updatingProductId === p.id    ? "Duplicando..."    : "Duplicar"}</button>
                <button  disabled={updatingProductId === p.id}  onClick={() =>    setProductArchived(p, true)  }>  {updatingProductId === p.id    ? "Arquivando..."    : "Arquivar"}</button>
                <button  className="danger"  disabled={updatingProductId === p.id}  onClick={() => deleteProduct(p)}>  {updatingProductId === p.id    ? "Excluindo..."    : "Excluir"}</button>
              </div>
              {p.featured && (
                <div className="feature-order">
                  <span>
                    Ordem do destaque
                  </span>

                  <button
                    disabled={
                      updatingProductId !== null ||
                      orderedFeaturedProducts[0]?.id === p.id
                    }
                    onClick={() =>
                      moveFeaturedProduct(p, -1)
                    }
                    aria-label={`Subir ${p.name}`}
                  >
                    ↑
                  </button>

                  <button
                    disabled={
                      updatingProductId !== null ||
                      orderedFeaturedProducts[
                        orderedFeaturedProducts.length - 1
                      ]?.id === p.id
                    }
                    onClick={() =>
                      moveFeaturedProduct(p, 1)
                    }
                    aria-label={`Descer ${p.name}`}
                  >
                    ↓
                  </button>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
      {products.some(p => p.archived) && (
        <section className="archived-products panel">
          <h3>Produtos arquivados</h3>
          {products.filter(p => p.archived).map(p => <div key={p.id}><span>{p.name}</span><button  disabled={updatingProductId === p.id}  onClick={() =>    setProductArchived(p, false)  }>  {updatingProductId === p.id    ? "Restaurando..."    : "Restaurar"}</button></div>)}
        </section>
      )}
      {open && (
        <div className="modal-backdrop" onMouseDown={e => e.currentTarget === e.target && setOpen(false)}>
          <form className="modal product-modal" onSubmit={submit}>
            <div className="modal-title"><div><p>{editing ? "EDITAR PRODUTO" : "NOVO PRODUTO"}</p><h2>{editing ? "Atualizar catálogo" : "Adicionar ao catálogo"}</h2></div><button type="button" onClick={() => setOpen(false)}>×</button></div>
            <div className="product-form-layout">
              <label className="image-upload">
                {image ? <img src={image} alt="Prévia" /> : <><span>▧</span><b>Adicionar foto</b><small>PNG, JPG ou WEBP — máximo de 5 MB</small></>}
                <input required={!editing} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImage}/>
              </label>
              <div className="form-grid compact-form">
                <label className="wide">Título<input required name="name" defaultValue={editing?.name} /></label>
                <label>Categoria<select name="category" defaultValue={editing?.category}><option>Bolos</option><option>Tortas</option><option>Doces</option><option>Salgados</option><option>Kits</option><option>Outros</option></select></label>
                <label>Preço base<input required name="price" defaultValue={editing?.price.replace("R$ ", "")} /></label>
                <label>Prazo<input required name="preparation" defaultValue={editing?.preparation} /></label>
                <label>Pedido mínimo<input required name="minimum" defaultValue={editing?.minimum} /></label>
                <label>Estoque atual<input required name="stock" type="number" defaultValue={editing?.stock || 0} /></label>
                <label>Alerta de estoque<input required name="lowStock" type="number" defaultValue={editing?.lowStock || 3} /></label>
              </div>
            </div>
            <div className="form-grid product-description">
              <label className="wide">Descrição<textarea required name="description" defaultValue={editing?.description} /></label>
              <label className="wide">
                Opções de personalização

                <select
                  multiple
                  size={3}
                  name="options"
                  defaultValue={
                    (editing?.options || []).map(
                      option => {
                        const normalizedOption =
                          option
                            .trim()
                            .toLowerCase();

                        if (
                          normalizedOption ===
                          "tamanho"
                        ) {
                          return "Tamanho";
                        }

                        if (
                          normalizedOption ===
                          "recheio"
                        ) {
                          return "Recheio";
                        }

                        if (
                          normalizedOption ===
                            "decoração" ||
                          normalizedOption ===
                            "decoracao"
                        ) {
                          return "Decoração";
                        }

                        return option;
                      }
                    )
                  }
                >
                  <option value="Tamanho">
                    Tamanho
                  </option>

                  <option value="Recheio">
                    Recheio
                  </option>

                  <option value="Decoração">
                    Decoração
                  </option>
                </select>

                <small>
                  Selecione uma ou mais opções. Use Ctrl
                  para selecionar várias no computador.
                </small>
              </label>
            </div>
            <div className="product-checks">
              <label><input name="active" type="checkbox" defaultChecked={editing?.active ?? true} /> Publicar</label>
              <label><input name="featured" type="checkbox" defaultChecked={editing?.featured} /> Destaque</label>
              <label><input name="customizable" type="checkbox" defaultChecked={editing?.customizable ?? true} /> Permitir personalização</label>
            </div>
            <div className="modal-actions"><button type="button" className="secondary" onClick={() => setOpen(false)}>Cancelar</button><button className="primary" disabled={saving} > {saving  ? "Salvando produto..." : "Salvar produto"}</button></div>
          </form>
        </div>
      )}
    </div>
  );
}