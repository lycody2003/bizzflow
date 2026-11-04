import Product from "@models/product.model";
import AppError from "@shared-errors/app.error";
import type { Types } from "mongoose";

interface CreateProductInput {
  name: string;
  sku: string;
  barcode?: string | null;
  barcodeType?: "EAN13" | "UPC" | "EAN8" | "CODE128" | "QR" | null;
  description?: string;
  category?: string;
  categoryId?: string;
  type?: "standard" | "variant";
  unit?: string;
  costPrice: number;
  sellingPrice: number;
  currency?: "USD" | "KHR";
  stockQuantity?: number;
  minimumStock?: number;
  status?: "active" | "inactive";
}

interface UpdateProductInput {
  name?: string;
  sku?: string;
  barcode?: string | null;
  barcodeType?: "EAN13" | "UPC" | "EAN8" | "CODE128" | "QR" | null;
  description?: string;
  category?: string;
  categoryId?: string;
  type?: "standard" | "variant";
  unit?: string;
  costPrice?: number;
  sellingPrice?: number;
  currency?: "USD" | "KHR";
  stockQuantity?: number;
  minimumStock?: number;
  status?: "active" | "inactive";
}

interface GetProductsQuery {
  search?: string;
  status?: "active" | "inactive";
  page?: number;
  limit?: number;
}

class ProductService {
  private handleDatabaseError(error: unknown): never {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      throw new AppError(
        "A product with this SKU already exists in your business.",
        409,
      );
    }

    throw error;
  }

  async create(businessId: string, input: CreateProductInput) {
    try {
      return await Product.create({
        ...input,
        category: input.category ?? input.categoryId ?? "",
        categoryId: input.categoryId ?? input.category ?? "",
        stockQuantity: input.stockQuantity ?? 0,
        businessId,
      });
    } catch (error) {
      return this.handleDatabaseError(error);
    }
  }

  async getAll(businessId: string, query: GetProductsQuery) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 10));
    const skip = (page - 1) * limit;

    const filter: {
      businessId: Types.ObjectId | string;
      status?: "active" | "inactive";
      $or?: Array<Record<string, unknown>>;
    } = {
      businessId,
      status: query.status ?? "active",
    };

    if (query.search?.trim()) {
      const escapedSearch = query.search
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      const searchRegex = new RegExp(escapedSearch, "i");

      filter.$or = [
        { name: searchRegex },
        { sku: searchRegex },
        { category: searchRegex },
        { categoryId: searchRegex },
        { barcode: searchRegex },
      ];
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Product.countDocuments(filter),
    ]);

    return {
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(businessId: string, productId: string) {
    const product = await Product.findOne({
      _id: productId,
      businessId,
    }).populate({
      path: "categoryId",
      model: "Category",
      select: "name icon isActive",
    });

    if (!product) {
      throw new AppError("Product not found.", 404);
    }

    return product;
  }

  async update(
    businessId: string,
    productId: string,
    input: UpdateProductInput,
  ) {
    try {
      const updateData: UpdateProductInput = { ...input };

      if (input.categoryId !== undefined) {
        updateData.category = input.categoryId;
      }

      const product = await Product.findOneAndUpdate(
        {
          _id: productId,
          businessId,
        },
        {
          $set: updateData,
        },
        {
          new: true,
          runValidators: true,
        },
      );

      if (!product) {
        throw new AppError("Product not found.", 404);
      }

      return product;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      return this.handleDatabaseError(error);
    }
  }

  async remove(businessId: string, productId: string) {
    const product = await Product.findOneAndUpdate(
      {
        _id: productId,
        businessId,
        status: "active",
      },
      {
        $set: {
          status: "inactive",
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!product) {
      throw new AppError("Product not found.", 404);
    }

    return product;
  }
}

export default new ProductService();
