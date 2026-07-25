import type {
  Product,
} from "../types";

export function getProductImagePath(
  publicUrl: string
) {
  const marker =
    "/storage/v1/object/public/product-images/";

  const markerPosition =
    publicUrl.indexOf(marker);

  if (markerPosition === -1) {
    return null;
  }

  return decodeURIComponent(
    publicUrl.slice(
      markerPosition + marker.length
    )
  );
}

export function getNextFeaturedOrder(
  products: Product[]
) {
  const highestOrder =
    products.reduce(
      (highest, product) =>
        product.featured
          ? Math.max(
              highest,
              product.featuredOrder
            )
          : highest,
      0
    );

  return highestOrder + 1;
}