import mongoose from "mongoose";

import Unit from "@models/unit.model";
import Product, {
  type ProductAttributeDefinition,
  type ProductDocument,
} from "@models/product.model";
import ProductVariant from "@models/product-variant.model";
import InventoryBalance from "@models/inventory-balance.model";
import StockMovement from "@models/stock-movement.model";
import Category from "@models/category.model";

import skuRegistryService from "@services/product/sku-registry.service";
import AppError from "@shared-errors/app.error";

interface BaseProductInput {
  name: string;
  barcode?: string | null;
  barcodeType?: "EAN13" | "UPC" | "EAN8" | "CODE128" | "QR" | null;
  description?: string;
  category: string;
  unit: string;
  currency?: "USD" | "KHR";
  status?: "active" | "inactive";
}

interface StandardProductInput extends BaseProductInput {
  type?: "standard";
  sku: string;
  costPrice: number;
  sellingPrice: number;
  stockQuantity?: number;
  minimumStock?: number;
  attributeDefinitions?: ProductAttributeDefinition[];
}

interface VariantProductInput extends BaseProductInput {
  type: "variant";
  attributeDefinitions: ProductAttributeDefinition[];
}

type CreateProductInput = StandardProductInput | VariantProductInput;

interface UpdateProductInput {
  name?: string;
  sku?: string;
  barcode?: string | null;
  barcodeType?: "EAN13" | "UPC" | "EAN8" | "CODE128" | "QR" | null;
  description?: string;
  category?: string;
  unit?: string;
  currency?: "USD" | "KHR";
  status?: "active" | "inactive";
  attributeDefinitions?: ProductAttributeDefinition[];
  costPrice?: number;
  sellingPrice?: number;
  minimumStock?: number;
}

interface GetProductsQuery {
  search?: string;
  status?: "active" | "inactive";
  page?: number;
  limit?: number;
}

class ProductService {
  private async validateCategory(
    businessId: string,
    category?: string,
  ): Promise<void> {
    if (!category) {
      throw new AppError("Category is required.", 400);
    }

    const result = await Category.findOne({
      _id: category,
      businessId,
      isActive: true,
    }).select("_id");

    if (!result) {
      throw new AppError("Category not found or inactive.", 400);
    }
  }

  private async validateUnit(businessId: string, unit?: string): Promise<void> {
    if (!unit) {
      throw new AppError("Unit is required.", 400);
    }

    const result = await Unit.findOne({
      _id: unit,
      businessId,
      isActive: true,
    }).select("_id");

    if (!result) {
      throw new AppError("Unit not found or inactive.", 400);
    }
  }

  private handleDatabaseError(error: unknown): never {
    if (
      error instanceof mongoose.mongo.MongoServerError &&
      error.code === 11000
    ) {
      throw new AppError(
        "A product with this SKU already exists in your business.",
        409,
      );
    }

    throw error;
  }

  async create(
    businessId: string,
    userId: string,
    input: CreateProductInput,
  ): Promise<ProductDocument> {
    await this.validateCategory(businessId, input.category);
    await this.validateUnit(businessId, input.unit);

    const session = await mongoose.startSession();

    let createdProduct: ProductDocument | null = null;

    try {
      await session.withTransaction(async () => {
        const product = new Product({
          ...input,
          type: input.type ?? "standard",
          category: input.category,
          unit: input.unit,
          businessId,
          ...(input.type === "variant"
            ? {
                sku: null,
                costPrice: null,
                sellingPrice: null,
                stockQuantity: null,
                minimumStock: null,
              }
            : {
                stockQuantity: input.stockQuantity ?? 0,
                minimumStock: input.minimumStock ?? 0,
              }),
        });

        await product.save({ session });

        if (product.type === "standard") {
          // 1. Register SKU
          if (product.sku) {
            await skuRegistryService.register(
              {
                businessId: new mongoose.Types.ObjectId(businessId),
                sku: product.sku,
                referenceType: "product",
                referenceId: product._id,
              },
              session,
            );
          }

          // 2. Create InventoryBalance
          const openingQuantity = product.stockQuantity ?? 0;

          const inventoryBalance = new InventoryBalance({
            businessId: new mongoose.Types.ObjectId(businessId),
            productId: product._id,
            quantityOnHand: openingQuantity,
          });

          await inventoryBalance.save({ session });

          // 3. Create StockMovement if opening quantity > 0
          if (openingQuantity > 0) {
            const stockMovement = new StockMovement({
              businessId: new mongoose.Types.ObjectId(businessId),
              productId: product._id,
              type: "opening",
              quantity: openingQuantity,
              quantityBefore: 0,
              quantityAfter: openingQuantity,
              reason: "Opening stock",
              performedBy: new mongoose.Types.ObjectId(userId),
            });

            await stockMovement.save({ session });
          }
        }

        createdProduct = product;
      });
    } catch (error) {
      return this.handleDatabaseError(error);
    } finally {
      await session.endSession();
    }

    if (!createdProduct) {
      throw new AppError("Product creation failed.", 500);
    }

    return createdProduct;
  }

  async getAll(businessId: string, query: GetProductsQuery) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 10));
    const skip = (page - 1) * limit;

    const filter: {
      businessId: string;
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
        { barcode: searchRegex },
      ];
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate({
          path: "unit",
          model: "Unit",
          select: "name symbol isActive",
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Product.countDocuments(filter),
    ]);

    const standardProductIds = products
      .filter((product) => product.type === "standard")
      .map((product) => product._id);

    const balances = standardProductIds.length
      ? await InventoryBalance.find({
          businessId: new mongoose.Types.ObjectId(businessId),
          productId: { $in: standardProductIds },
          variantId: { $exists: false },
        })
          .select("productId quantityOnHand")
          .lean()
      : [];

    const stockByProductId = new Map(
      balances.map((balance) => [
        String(balance.productId),
        balance.quantityOnHand,
      ]),
    );

    const productsWithCurrentStock = products.map((product) =>
      product.type === "standard"
        ? {
            ...product,
            stockQuantity: stockByProductId.get(String(product._id)) ?? 0,
          }
        : product,
    );

    return {
      products: productsWithCurrentStock,
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
    })
      .populate({
        path: "category",
        model: "Category",
        select: "name icon isActive",
      })
      .populate({
        path: "unit",
        model: "Unit",
        select: "name symbol isActive",
      });

    if (!product) {
      throw new AppError("Product not found.", 404);
    }

    if (product.type === "standard") {
      const balance = await InventoryBalance.findOne({
        businessId: new mongoose.Types.ObjectId(businessId),
        productId: product._id,
        variantId: { $exists: false },
      })
        .select("quantityOnHand")
        .exec();

      product.set("stockQuantity", balance?.quantityOnHand ?? 0);
    }

    return product;
  }

  async update(
    businessId: string,
    productId: string,
    input: UpdateProductInput,
  ): Promise<ProductDocument> {
    if (input.category !== undefined) {
      await this.validateCategory(businessId, input.category);
    }

    if (input.unit !== undefined) {
      await this.validateUnit(businessId, input.unit);
    }

    const session = await mongoose.startSession();

    let updatedProduct: ProductDocument | null = null;

    try {
      await session.withTransaction(async () => {
        const product = await Product.findOne({
          _id: productId,
          businessId,
        }).session(session);

        if (!product) {
          throw new AppError("Product not found.", 404);
        }

        if (product.type === "variant") {
          const forbiddenFields = [
            "sku",
            "costPrice",
            "sellingPrice",
            "stockQuantity",
            "minimumStock",
          ];

          const invalidField = forbiddenFields.find(
            (field) => input[field as keyof UpdateProductInput] !== undefined,
          );

          if (invalidField) {
            throw new AppError(
              `${invalidField} must be managed through Product Variants.`,
              400,
            );
          }

          if (input.attributeDefinitions !== undefined) {
            const existingVariants = await ProductVariant.find({
              businessId,
              productId: product._id,
            })
              .select("attributes")
              .session(session);

            if (existingVariants.length > 0) {
              const normalizeName = (value: string) =>
                value.trim().toLowerCase();

              const normalizeValue = (value: string) =>
                value.trim().toLowerCase();

              const currentDefinitions = product.attributeDefinitions;
              const incomingDefinitions = input.attributeDefinitions;

              const currentNames = currentDefinitions
                .map((definition: ProductAttributeDefinition) =>
                  normalizeName(definition.name),
                )
                .sort();

              const incomingNames = incomingDefinitions
                .map((definition: ProductAttributeDefinition) =>
                  normalizeName(definition.name),
                )
                .sort();

              const sameAttributeNames =
                JSON.stringify(currentNames) === JSON.stringify(incomingNames);

              if (!sameAttributeNames) {
                throw new AppError(
                  "Attribute names cannot be added, removed, or renamed while variants exist.",
                  409,
                );
              }

              const incomingValuesByName = new Map(
                incomingDefinitions.map((definition) => [
                  normalizeName(definition.name),
                  new Set(definition.values.map(normalizeValue)),
                ]),
              );

              for (const variant of existingVariants) {
                for (const attribute of variant.attributes) {
                  const attributeName = normalizeName(attribute.name);
                  const attributeValue = normalizeValue(attribute.value);

                  const allowedValues = incomingValuesByName.get(attributeName);

                  if (!allowedValues?.has(attributeValue)) {
                    throw new AppError(
                      `Cannot remove "${attribute.value}" from "${attribute.name}" because an existing variant uses it.`,
                      409,
                    );
                  }
                }
              }
            }
          }
        } else if (input.attributeDefinitions !== undefined) {
          throw new AppError(
            "Attribute definitions are only available for Variant Parent products.",
            400,
          );
        }

        if (
          product.type === "standard" &&
          input.sku !== undefined &&
          input.sku.trim().toUpperCase() !== product.sku
        ) {
          await skuRegistryService.update(
            {
              businessId: new mongoose.Types.ObjectId(businessId),
              sku: input.sku,
              referenceType: "product",
              referenceId: product._id,
            },
            session,
          );
        }

        product.set(input);

        await product.save({ session });

        updatedProduct = product;
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      return this.handleDatabaseError(error);
    } finally {
      await session.endSession();
    }

    if (!updatedProduct) {
      throw new AppError("Product update failed.", 500);
    }

    return updatedProduct;
  }

  async remove(
    businessId: string,
    productId: string,
  ): Promise<ProductDocument> {
    const session = await mongoose.startSession();

    let deactivatedProduct: ProductDocument | null = null;

    try {
      await session.withTransaction(async () => {
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
            session,
          },
        );

        if (!product) {
          throw new AppError("Product not found.", 404);
        }

        if (product.type === "variant") {
          await ProductVariant.updateMany(
            {
              businessId,
              productId: product._id,
              status: "active",
            },
            {
              $set: {
                status: "inactive",
              },
            },
            { session },
          );
        }

        deactivatedProduct = product;
      });
    } finally {
      await session.endSession();
    }

    if (!deactivatedProduct) {
      throw new AppError("Product deactivation failed.", 500);
    }

    // Product and Variant SKUs remain reserved after deactivation.
    return deactivatedProduct;
  }
}

export default new ProductService();
