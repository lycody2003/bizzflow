import type { ApiResponse } from "@app-types/auth";
import type {
  Product,
  CreateProductInput,
  UpdateProductInput,
  BarcodeType,
  ProductCurrency,
  ProductStatus,
  ProductType,
} from "@app-types/product";
import type { ProductRepository } from "@repositories/contracts/product.repository";

interface BackendProduct {
  _id: string;
  businessId: string;
  name: string;
  sku: string;
  barcode?: string | null;
  barcodeType?: BarcodeType | null;
  description?: string;
  categoryId?:
    | string
    | {
        _id: string;
        name: string;
        icon?: string | null;
        isActive?: boolean;
      };
  type?: ProductType;
  unit?: string;
  costPrice: number;
  sellingPrice: number;
  currency?: ProductCurrency;
  stockQuantity?: number;
  minimumStock?: number;
  status: ProductStatus;

  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ProductListResponse {
  products: BackendProduct[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

function mapProduct(data: BackendProduct): Product {
  return {
    id: data._id,
    businessId: String(data.businessId),
    name: data.name,
    sku: data.sku,
    barcode: data.barcode ?? null,
    barcodeType: data.barcodeType ?? null,
    description: data.description ?? "",
    categoryId:
      typeof data.categoryId === "string"
        ? data.categoryId
        : (data.categoryId?._id ?? ""),
    categoryName:
      typeof data.categoryId === "object" ? data.categoryId.name : undefined,
    type: data.type ?? "standard",
    unit: data.unit ?? "piece",
    costPrice: data.costPrice,
    sellingPrice: data.sellingPrice,
    currency: data.currency ?? "USD",
    currentStock: data.stockQuantity ?? 0,
    minimumStock: data.minimumStock ?? 0,
    status: data.status,
    imageUrl: data.imageUrl ?? null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export default function createProductApiRepository(): ProductRepository {
  const { request } = useApi();

  async function getProductsByStatus(
    status: ProductStatus,
  ): Promise<Product[]> {
    const allProducts: Product[] = [];
    let page = 1;
    let totalPages = 1;

    do {
      const response = await request<ProductListResponse>(
        `/products?status=${status}&page=${page}&limit=100`,
        {
          method: "GET",
          requiresAuth: true,
        },
      );

      if (!response.success || !response.data) {
        throw new Error(response.message || "Unable to load products.");
      }

      allProducts.push(...response.data.products.map(mapProduct));
      totalPages = response.data.pagination.totalPages;
      page++;
    } while (page <= totalPages);

    return allProducts;
  }

  async function findAll(businessId: string): Promise<Product[]> {
    const [activeProducts, inactiveProducts] = await Promise.all([
      getProductsByStatus("active"),
      getProductsByStatus("inactive"),
    ]);

    return [...activeProducts, ...inactiveProducts]
      .filter((product) => product.businessId === businessId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async function findById(
    id: string,
    businessId: string,
  ): Promise<Product | null> {
    const response = await request<BackendProduct>(`/products/${id}`, {
      method: "GET",
      requiresAuth: true,
    });

    if (!response.success || !response.data) {
      throw new Error(response.message || "Unable to load product.");
    }

    const product = mapProduct(response.data);

    return product.businessId === businessId ? product : null;
  }

  async function create(data: CreateProductInput): Promise<Product> {
    const { businessId: _businessId, imageUrl: _imageUrl, ...input } = data;

    const response = await request<BackendProduct>("/products", {
      method: "POST",
      body: input,
      requiresAuth: true,
      requiresCsrf: true,
    });

    if (!response.success || !response.data) {
      throw new Error(response.message || "Unable to create product.");
    }

    return mapProduct(response.data);
  }

  async function update(
    id: string,
    businessId: string,
    data: UpdateProductInput,
  ): Promise<Product> {
    const { imageUrl: _imageUrl, ...input } = data;

    const response = await request<BackendProduct>(`/products/${id}`, {
      method: "PATCH",
      body: input,
      requiresAuth: true,
      requiresCsrf: true,
    });

    if (!response.success || !response.data) {
      throw new Error(response.message || "Unable to update product.");
    }

    const product = mapProduct(response.data);

    if (product.businessId !== businessId) {
      throw new Error("Product does not belong to the selected business.");
    }

    return product;
  }

  async function remove(id: string, businessId: string): Promise<void> {
    const product = await findById(id, businessId);

    if (!product) {
      throw new Error("Product not found.");
    }

    const response = await request<BackendProduct>(`/products/${id}`, {
      method: "DELETE",
      requiresAuth: true,
      requiresCsrf: true,
    });

    if (!response.success) {
      throw new Error(response.message || "Unable to deactivate product.");
    }
  }

  return {
    findAll,
    findById,
    create,
    update,
    delete: remove,
  };
}
