import type { ApiResponse } from "@app-types/auth";
import type {
  Product,
  ProductUnit,
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
  category?:
    | string
    | {
        _id: string;
        name: string;
        icon?: string | null;
        isActive?: boolean;
      };
  type?: ProductType;
  unit?: {
    _id: string;
    name: string;
    symbol: string;
    isActive?: boolean;
  };
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
    category:
      typeof data.category === "string"
        ? data.category
        : (data.category?._id ?? ""),
    categoryName:
      typeof data.category === "object" ? data.category.name : undefined,
    type: data.type ?? "standard",
    unit: (() => {
      if (!data.unit) {
        throw new Error("Product unit was not populated by the API.");
      }

      return {
        id: data.unit._id,
        name: data.unit.name,
        symbol: data.unit.symbol,
        isActive: data.unit.isActive,
      } satisfies ProductUnit;
    })(),
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

    const product = await findById(response.data._id, data.businessId);

    if (!product) {
      throw new Error("Created product could not be loaded.");
    }

    return product;
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

    const product = await findById(response.data._id, businessId);

    if (!product) {
      throw new Error("Updated product could not be loaded.");
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
