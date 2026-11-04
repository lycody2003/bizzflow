import type {
  ProductImage,
  ProductImageRepository,
} from "@repositories/contracts/product-image.repository";

interface ProductImageResponse {
  imageUrl: string | null;
}

export default function createProductImageApiRepository(): ProductImageRepository {
  const { request } = useApi();

  async function save(image: ProductImage): Promise<void> {
    const formData = new FormData();

    if (!image.blob) {
      throw new Error("Product image file is required.");
    }

    formData.append("image", image.blob, "product-image");

    const response = await request<ProductImageResponse>(
      `/products/${image.productId}/image`,
      {
        method: "PUT",
        body: formData,
        requiresAuth: true,
        requiresCsrf: true,
      },
    );

    if (!response.success || !response.data?.imageUrl) {
      throw new Error(response.message || "Unable to upload product image.");
    }
  }

  async function findByProductId(
    productId: string,
    businessId: string,
  ): Promise<ProductImage | null> {
    const response = await request<ProductImageResponse>(
      `/products/${productId}`,
      {
        method: "GET",
        requiresAuth: true,
      },
    );

    if (!response.success || !response.data?.imageUrl) {
      return null;
    }

    return {
      productId,
      businessId,
      blob: null,
      imageUrl: response.data.imageUrl,
      mimeType: "image/remote",
      updatedAt: new Date().toISOString(),
    };
  }

  async function remove(
    productId: string,
    businessId: string,
  ): Promise<void> {
    const response = await request<ProductImageResponse>(
      `/products/${productId}/image`,
      {
        method: "DELETE",
        requiresAuth: true,
        requiresCsrf: true,
      },
    );

    if (!response.success) {
      throw new Error(response.message || "Unable to remove product image.");
    }
  }

  return {
    save,
    findByProductId,
    delete: remove,
  };
}
