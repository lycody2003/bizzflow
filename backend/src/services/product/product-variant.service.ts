import mongoose from "mongoose";

import Product from "@models/product.model";
import ProductVariant, {
  type ProductVariantAttribute,
  type ProductVariantDocument,
} from "@models/product-variant.model";

import skuRegistryService from "@services/product/sku-registry.service";
import InventoryBalance from "@models/inventory-balance.model";
import StockMovement from "@models/stock-movement.model";
import AppError from "@shared-errors/app.error";

interface CreateVariantInput {
  sku: string;
  barcode?: string | null;
  barcodeType?: "EAN13" | "UPC" | "EAN8" | "CODE128" | "QR" | null;
  attributes: ProductVariantAttribute[];
  costPrice: number;
  sellingPrice: number;
  currency?: "USD" | "KHR";
  stockQuantity?: number;
  minimumStock?: number;
  status?: "active" | "inactive";
}

interface UpdateVariantInput {
  sku?: string;
  barcode?: string | null;
  barcodeType?: "EAN13" | "UPC" | "EAN8" | "CODE128" | "QR" | null;
  attributes?: ProductVariantAttribute[];
  costPrice?: number;
  sellingPrice?: number;
  currency?: "USD" | "KHR";
  minimumStock?: number;
  status?: "active" | "inactive";
}

class ProductVariantService {
  private async validateParent(
    businessId: string,
    productId: string,
    session?: mongoose.ClientSession,
  ) {
    const productQuery = Product.findOne({
      _id: productId,
      businessId,
      type: "variant",
      status: "active",
    }).select("attributeDefinitions");

    if (session) {
      productQuery.session(session);
    }

    const product = await productQuery;

    if (!product) {
      throw new AppError("Active Variant Parent product not found.", 404);
    }

    return product;
  }

  private validateAttributes(
    definitions: Array<{ name: string; values: string[] }>,
    attributes: ProductVariantAttribute[],
  ): ProductVariantAttribute[] {
    if (definitions.length === 0) {
      throw new AppError("Variant Parent has no attribute definitions.", 400);
    }

    const definitionMap = new Map<
      string,
      { name: string; values: Map<string, string> }
    >();

    for (const definition of definitions) {
      const normalizedName = definition.name.trim().toLowerCase();

      if (definitionMap.has(normalizedName)) {
        throw new AppError(
          `Duplicate attribute definition: ${definition.name}`,
          400,
        );
      }

      const values = new Map<string, string>();

      for (const value of definition.values) {
        const normalizedValue = value.trim().toLowerCase();

        if (values.has(normalizedValue)) {
          throw new AppError(
            `Duplicate value "${value}" in attribute "${definition.name}".`,
            400,
          );
        }

        values.set(normalizedValue, value);
      }

      definitionMap.set(normalizedName, {
        name: definition.name,
        values,
      });
    }

    if (attributes.length !== definitionMap.size) {
      throw new AppError(
        "Every defined attribute must have exactly one value.",
        400,
      );
    }

    const seen = new Set<string>();
    const normalizedAttributes: ProductVariantAttribute[] = [];

    for (const attribute of attributes) {
      const normalizedName = attribute.name.trim().toLowerCase();
      const normalizedValue = attribute.value.trim().toLowerCase();

      if (seen.has(normalizedName)) {
        throw new AppError(
          `Duplicate variant attribute: ${attribute.name}`,
          400,
        );
      }

      seen.add(normalizedName);

      const definition = definitionMap.get(normalizedName);

      if (!definition) {
        throw new AppError(
          `Attribute "${attribute.name}" is not defined by the parent product.`,
          400,
        );
      }

      const canonicalValue = definition.values.get(normalizedValue);

      if (canonicalValue === undefined) {
        throw new AppError(
          `Value "${attribute.value}" is not allowed for "${definition.name}".`,
          400,
        );
      }

      normalizedAttributes.push({
        name: definition.name,
        value: canonicalValue,
      });
    }

    return normalizedAttributes;
  }

  private generateCombinationKey(
    attributes: ProductVariantAttribute[],
  ): string {
    return attributes
      .map((attribute) => ({
        name: attribute.name.trim().toLowerCase(),
        value: attribute.value.trim().toLowerCase(),
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(
        (attribute) =>
          `${encodeURIComponent(attribute.name)}:${encodeURIComponent(attribute.value)}`,
      )
      .join("|");
  }

  private handleDatabaseError(error: unknown): never {
    if (
      error instanceof mongoose.mongo.MongoServerError &&
      error.code === 11000
    ) {
      const keyPattern = error.keyPattern as Record<string, number> | undefined;

      if (keyPattern?.combinationKey) {
        throw new AppError(
          "This variant combination already exists for this product.",
          409,
        );
      }

      if (keyPattern?.sku) {
        throw new AppError("SKU already exists in this business.", 409);
      }

      if (keyPattern?.barcode) {
        throw new AppError("Barcode already exists in this business.", 409);
      }

      throw new AppError(
        "A duplicate ProductVariant record already exists.",
        409,
      );
    }

    throw error;
  }

  async create(
    businessId: string,
    userId: string,
    productId: string,
    input: CreateVariantInput,
  ): Promise<ProductVariantDocument> {
    const session = await mongoose.startSession();

    let createdVariant: ProductVariantDocument | null = null;

    try {
      await session.withTransaction(async () => {
        const parent = await this.validateParent(
          businessId,
          productId,
          session,
        );

        const attributes = this.validateAttributes(
          parent.attributeDefinitions,
          input.attributes,
        );

        const variant = new ProductVariant({
          ...input,
          sku: input.sku.trim().toUpperCase(),
          attributes,
          combinationKey: this.generateCombinationKey(attributes),
          productId: parent._id,
          businessId,
          stockQuantity: input.stockQuantity ?? 0,
          minimumStock: input.minimumStock ?? 0,
        });

        await variant.save({ session });

        await skuRegistryService.register(
          {
            businessId: new mongoose.Types.ObjectId(businessId),
            sku: variant.sku,
            referenceType: "variant",
            referenceId: variant._id,
          },
          session,
        );

        // 1. Create InventoryBalance
        const openingQuantity = variant.stockQuantity;

        const inventoryBalance = new InventoryBalance({
          businessId: new mongoose.Types.ObjectId(businessId),
          productId: parent._id,
          variantId: variant._id,
          quantityOnHand: openingQuantity,
        });

        await inventoryBalance.save({ session });

        // 2. Create StockMovement if opening quantity > 0
        if (openingQuantity > 0) {
          const stockMovement = new StockMovement({
            businessId: new mongoose.Types.ObjectId(businessId),
            productId: parent._id,
            variantId: variant._id,
            type: "opening",
            quantity: openingQuantity,
            quantityBefore: 0,
            quantityAfter: openingQuantity,
            reason: "Opening stock",
            performedBy: new mongoose.Types.ObjectId(userId),
          });

          await stockMovement.save({ session });
        }

        createdVariant = variant;
      });
    } catch (error) {
      return this.handleDatabaseError(error);
    } finally {
      await session.endSession();
    }

    if (!createdVariant) {
      throw new AppError("Variant creation failed.", 500);
    }

    return createdVariant;
  }

  async bulkCreate(
    businessId: string,
    userId: string,
    productId: string,
    inputs: CreateVariantInput[],
  ): Promise<ProductVariantDocument[]> {
    const session = await mongoose.startSession();

    let createdVariants: ProductVariantDocument[] = [];

    try {
      const transactionResult = await session.withTransaction(async () => {
        const transactionVariants: ProductVariantDocument[] = [];

        const parent = await this.validateParent(
          businessId,
          productId,
          session,
        );

        const existingVariants = await ProductVariant.find({
          businessId,
          productId: parent._id,
        })
          .select("attributes combinationKey")
          .session(session)
          .lean();

        const existingCombinations = new Set(
          existingVariants.map(
            (variant) =>
              variant.combinationKey ??
              this.generateCombinationKey(variant.attributes),
          ),
        );

        const seenCombinations = new Set<string>();

        for (const input of inputs) {
          const attributes = this.validateAttributes(
            parent.attributeDefinitions,
            input.attributes,
          );

          const combinationKey = this.generateCombinationKey(attributes);

          if (existingCombinations.has(combinationKey)) {
            throw new AppError(
              "This variant combination already exists for this product.",
              409,
            );
          }

          if (seenCombinations.has(combinationKey)) {
            throw new AppError(
              "Duplicate variant combination in request.",
              409,
            );
          }

          seenCombinations.add(combinationKey);

          const variant = new ProductVariant({
            ...input,
            sku: input.sku.trim().toUpperCase(),
            attributes,
            combinationKey,
            productId: parent._id,
            businessId,
            stockQuantity: input.stockQuantity ?? 0,
            minimumStock: input.minimumStock ?? 0,
          });

          await variant.save({ session });

          await skuRegistryService.register(
            {
              businessId: new mongoose.Types.ObjectId(businessId),
              sku: variant.sku,
              referenceType: "variant",
              referenceId: variant._id,
            },
            session,
          );

          // 1. Create InventoryBalance
          const openingQuantity = variant.stockQuantity;

          const inventoryBalance = new InventoryBalance({
            businessId: new mongoose.Types.ObjectId(businessId),
            productId: parent._id,
            variantId: variant._id,
            quantityOnHand: openingQuantity,
          });

          await inventoryBalance.save({ session });

          // 2. Create StockMovement if opening quantity > 0
          if (openingQuantity > 0) {
            const stockMovement = new StockMovement({
              businessId: new mongoose.Types.ObjectId(businessId),
              productId: parent._id,
              variantId: variant._id,
              type: "opening",
              quantity: openingQuantity,
              quantityBefore: 0,
              quantityAfter: openingQuantity,
              reason: "Opening stock",
              performedBy: new mongoose.Types.ObjectId(userId),
            });

            await stockMovement.save({ session });
          }

          transactionVariants.push(variant);
        }

        return transactionVariants;
      });

      createdVariants = transactionResult ?? [];
    } catch (error) {
      return this.handleDatabaseError(error);
    } finally {
      await session.endSession();
    }

    return createdVariants;
  }

  async getAll(
    businessId: string,
    productId: string,
    status?: "active" | "inactive",
  ) {
    await this.validateParent(businessId, productId);

    const variants = await ProductVariant.find({
      businessId,
      productId,
      ...(status ? { status } : {}),
    })
      .sort({ createdAt: -1 })
      .lean();

    if (variants.length === 0) {
      return variants;
    }

    const balances = await InventoryBalance.find({
      businessId: new mongoose.Types.ObjectId(businessId),
      productId: new mongoose.Types.ObjectId(productId),
      variantId: { $in: variants.map((variant) => variant._id) },
    })
      .select("variantId quantityOnHand")
      .lean();

    const stockByVariantId = new Map(
      balances.map((balance) => [
        String(balance.variantId),
        balance.quantityOnHand,
      ]),
    );

    return variants.map((variant) => ({
      ...variant,
      stockQuantity: stockByVariantId.get(String(variant._id)) ?? 0,
    }));
  }

  async getById(businessId: string, productId: string, variantId: string) {
    const variant = await ProductVariant.findOne({
      _id: variantId,
      businessId,
      productId,
    });

    if (!variant) {
      throw new AppError("Product variant not found.", 404);
    }

    const balance = await InventoryBalance.findOne({
      businessId: new mongoose.Types.ObjectId(businessId),
      productId: new mongoose.Types.ObjectId(productId),
      variantId: variant._id,
    })
      .select("quantityOnHand")
      .exec();

    variant.set("stockQuantity", balance?.quantityOnHand ?? 0);

    return variant;
  }

  async update(
    businessId: string,
    productId: string,
    variantId: string,
    input: UpdateVariantInput,
  ): Promise<ProductVariantDocument> {
    const session = await mongoose.startSession();


    try {
      await session.withTransaction(async () => {
        const parent = await this.validateParent(
          businessId,
          productId,
          session,
        );

        const variant = await ProductVariant.findOne({
          _id: variantId,
          businessId,
          productId,
        }).session(session);

        if (!variant) {
          throw new AppError("Product variant not found.", 404);
        }

        if (variant.status === "inactive") {
          const isRestoreOnly =
            input.status === "active" &&
            Object.keys(input).every((key) => key === "status");

          if (!isRestoreOnly) {
            throw new AppError("Inactive variants can only be restored.", 409);
          }
        }

        if (variant.status === "active" && input.status === "inactive") {
          throw new AppError(
            "Use the deactivate endpoint to deactivate a variant.",
            409,
          );
        }

        const updateData: UpdateVariantInput = { ...input };

        if (input.attributes !== undefined) {
          updateData.attributes = this.validateAttributes(
            parent.attributeDefinitions,
            input.attributes,
          );
        }

        const nextAttributes = updateData.attributes ?? variant.attributes;

        const nextCombinationKey = this.generateCombinationKey(nextAttributes);

        const duplicateCombination = await ProductVariant.findOne({
          businessId,
          productId: parent._id,
          combinationKey: nextCombinationKey,
          _id: { $ne: variant._id },
        }).session(session);

        if (duplicateCombination) {
          throw new AppError(
            "This variant combination already exists for this product.",
            409,
          );
        }

        variant.set({
          combinationKey: nextCombinationKey,
        });

        if (input.sku !== undefined) {
          updateData.sku = input.sku.trim().toUpperCase();

          if (updateData.sku !== variant.sku) {
            await skuRegistryService.update(
              {
                businessId: new mongoose.Types.ObjectId(businessId),
                sku: updateData.sku,
                referenceType: "variant",
                referenceId: variant._id,
              },
              session,
            );
          }
        }

        variant.set(updateData);
        await variant.save({ session });

      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      return this.handleDatabaseError(error);
    } finally {
      await session.endSession();
    }

    const updatedVariant = await ProductVariant.findOne({
      _id: variantId,
      businessId,
      productId,
    });

    if (!updatedVariant) {
      throw new AppError("Variant update failed.", 500);
    }

    const balance = await InventoryBalance.findOne({
      businessId: new mongoose.Types.ObjectId(businessId),
      productId: new mongoose.Types.ObjectId(productId),
      variantId: updatedVariant._id,
    })
      .select("quantityOnHand")
      .exec();

    updatedVariant.set("stockQuantity", balance?.quantityOnHand ?? 0);

    return updatedVariant;
  }

  async remove(businessId: string, productId: string, variantId: string) {
    const variant = await ProductVariant.findOneAndUpdate(
      {
        _id: variantId,
        businessId,
        productId,
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

    if (!variant) {
      throw new AppError("Product variant not found.", 404);
    }

    const balance = await InventoryBalance.findOne({
      businessId: new mongoose.Types.ObjectId(businessId),
      productId: new mongoose.Types.ObjectId(productId),
      variantId: variant._id,
    })
      .select("quantityOnHand")
      .exec();

    variant.set("stockQuantity", balance?.quantityOnHand ?? 0);

    // SKU remains reserved after deactivation.
    return variant;
  }
}

export default new ProductVariantService();
