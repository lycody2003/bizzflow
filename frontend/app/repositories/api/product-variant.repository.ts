import type {
  ProductVariant,
  ProductStatus,
  CreateProductVariantInput,
  UpdateProductVariantInput,
  BarcodeType,
  ProductCurrency,
} from "@app-types/product";

import type {
  ProductVariantRepository,
} from "@repositories/contracts/product-variant.repository";

interface BackendProductVariant {
  _id: string;
  productId: string;
  businessId: string;
  sku: string;
  barcode: string | null;
  barcodeType: BarcodeType | null;
  attributes: {
    name: string;
    value: string;
  }[];
  costPrice: number;
  sellingPrice: number;
  currency: ProductCurrency;
  stockQuantity: number;
  minimumStock: number;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

function mapVariant(data: BackendProductVariant): ProductVariant {
  return {
    id: String(data._id),
    productId: String(data.productId),
    businessId: String(data.businessId),
    sku: data.sku,
    barcode: data.barcode ?? null,
    barcodeType: data.barcodeType ?? null,
    attributes: data.attributes.map((attribute) => ({
      name: attribute.name,
      value: attribute.value,
    })),
    costPrice: data.costPrice,
    sellingPrice: data.sellingPrice,
    currency: data.currency,
    stockQuantity: data.stockQuantity,
    minimumStock: data.minimumStock,
    status: data.status,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export default function createProductVariantApiRepository(): ProductVariantRepository {
  const { request } = useApi();

  async function findAll(
    productId: string,
    businessId: string,
    status?: ProductStatus,
  ): Promise<ProductVariant[]> {
    const query = status ? `?status=${status}` : "";

    const response = await request<BackendProductVariant[]>(
      `/products/${productId}/variants${query}`,
      {
        method: "GET",
        requiresAuth: true,
      },
    );

    if (!response.success || !response.data) {
      throw new Error(
        response.message || "Unable to load product variants.",
      );
    }

    return response.data
      .map(mapVariant)
      .filter((variant) => variant.businessId === businessId);
  }

  async function findById(
    productId: string,
    variantId: string,
    businessId: string,
  ): Promise<ProductVariant | null> {
    const response = await request<BackendProductVariant>(
      `/products/${productId}/variants/${variantId}`,
      {
        method: "GET",
        requiresAuth: true,
      },
    );

    if (!response.success || !response.data) {
      throw new Error(
        response.message || "Unable to load product variant.",
      );
    }

    const variant = mapVariant(response.data);

    return variant.businessId === businessId ? variant : null;
  }

  async function create(
    productId: string,
    data: CreateProductVariantInput,
  ): Promise<ProductVariant> {
    const response = await request<BackendProductVariant>(
      `/products/${productId}/variants`,
      {
        method: "POST",
        body: data,
        requiresAuth: true,
        requiresCsrf: true,
      },
    );

    if (!response.success || !response.data) {
      throw new Error(
        response.message || "Unable to create product variant.",
      );
    }

    return mapVariant(response.data);
  }

  async function bulkCreate(
    productId: string,
    variants: CreateProductVariantInput[],
  ): Promise<ProductVariant[]> {
    const response = await request<BackendProductVariant[]>(
      `/products/${productId}/variants/bulk`,
      {
        method: "POST",
        body: { variants },
        requiresAuth: true,
        requiresCsrf: true,
      },
    );

    if (!response.success || !response.data) {
      throw new Error(
        response.message || "Unable to create product variants.",
      );
    }

    return response.data.map(mapVariant);
  }

  async function update(
    productId: string,
    variantId: string,
    businessId: string,
    data: UpdateProductVariantInput,
  ): Promise<ProductVariant> {
    const response = await request<BackendProductVariant>(
      `/products/${productId}/variants/${variantId}`,
      {
        method: "PATCH",
        body: data,
        requiresAuth: true,
        requiresCsrf: true,
      },
    );

    if (!response.success || !response.data) {
      throw new Error(
        response.message || "Unable to update product variant.",
      );
    }

    const variant = mapVariant(response.data);

    if (variant.businessId !== businessId) {
      throw new Error("Updated product variant could not be verified.");
    }

    return variant;
  }

  async function remove(
    productId: string,
    variantId: string,
    businessId: string,
  ): Promise<ProductVariant> {
    const response = await request<BackendProductVariant>(
      `/products/${productId}/variants/${variantId}`,
      {
        method: "DELETE",
        requiresAuth: true,
        requiresCsrf: true,
      },
    );

    if (!response.success || !response.data) {
      throw new Error(
        response.message || "Unable to deactivate product variant.",
      );
    }

    const variant = mapVariant(response.data);

    if (variant.businessId !== businessId) {
      throw new Error("Deactivated product variant could not be verified.");
    }

    return variant;
  }

  return {
    findAll,
    findById,
    create,
    bulkCreate,
    update,
    delete: remove,
  };
}
