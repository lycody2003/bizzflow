import type {
  ProductVariant,
  CreateProductVariantInput,
  UpdateProductVariantInput,
  ProductVariantAttribute,
  BarcodeType,
} from "../../types/product";

import type { ProductVariantRepository } from "../../repositories/contracts/product-variant.repository";
import createProductVariantApiRepository from "../../repositories/api/product-variant.repository";

export class ProductVariantService {
  constructor(private readonly repository: ProductVariantRepository) {}

  async getVariants(
    productId: string,
    businessId: string,
  ): Promise<ProductVariant[]> {
    this.validateId(productId, "Product ID");
    this.validateBusinessId(businessId);

    return this.repository.findAll(productId, businessId);
  }

  async getVariant(
    productId: string,
    variantId: string,
    businessId: string,
  ): Promise<ProductVariant | null> {
    this.validateId(productId, "Product ID");
    this.validateId(variantId, "Variant ID");
    this.validateBusinessId(businessId);

    return this.repository.findById(productId, variantId, businessId);
  }

  async getVariantsByStatus(
    productId: string,
    businessId: string,
    status: "active" | "inactive",
  ): Promise<ProductVariant[]> {
    this.validateId(productId, "Product ID");
    this.validateBusinessId(businessId);

    return this.repository.findAll(productId, businessId, status);
  }

  async createVariant(
    productId: string,
    businessId: string,
    data: CreateProductVariantInput,
  ): Promise<ProductVariant> {
    this.validateId(productId, "Product ID");
    this.validateBusinessId(businessId);
    this.validateCreateData(data);

    const normalizedData = this.normalizeCreateData(data);

    const variant = await this.repository.create(productId, normalizedData);

    this.validateReturnedVariant(variant, productId, businessId);

    return variant;
  }

  async bulkCreateVariants(
    productId: string,
    businessId: string,
    variants: CreateProductVariantInput[],
  ): Promise<ProductVariant[]> {
    this.validateId(productId, "Product ID");
    this.validateBusinessId(businessId);

    if (
      !Array.isArray(variants) ||
      variants.length === 0 ||
      variants.length > 100
    ) {
      throw new Error("Bulk creation requires between 1 and 100 variants.");
    }

    const normalizedVariants = variants.map((variant) => {
      this.validateCreateData(variant);
      return this.normalizeCreateData(variant);
    });

    const createdVariants = await this.repository.bulkCreate(
      productId,
      normalizedVariants,
    );

    for (const variant of createdVariants) {
      this.validateReturnedVariant(variant, productId, businessId);
    }

    return createdVariants;
  }

  async updateVariant(
    productId: string,
    variantId: string,
    businessId: string,
    data: UpdateProductVariantInput,
  ): Promise<ProductVariant> {
    this.validateId(productId, "Product ID");
    this.validateId(variantId, "Variant ID");
    this.validateBusinessId(businessId);
    this.validateUpdateData(data);

    const normalizedData = this.normalizeUpdateData(data);

    const updatedVariant = await this.repository.update(
      productId,
      variantId,
      businessId,
      normalizedData,
    );

    this.validateReturnedVariant(updatedVariant, productId, businessId);

    return updatedVariant;
  }

  async restoreVariant(
    productId: string,
    variantId: string,
    businessId: string,
  ): Promise<ProductVariant> {
    const restoredVariant = await this.updateVariant(
      productId,
      variantId,
      businessId,
      { status: "active" },
    );

    if (restoredVariant.status !== "active") {
      throw new Error("Product variant was not successfully restored.");
    }

    return restoredVariant;
  }

  async deleteVariant(
    productId: string,
    variantId: string,
    businessId: string,
  ): Promise<ProductVariant> {
    this.validateId(productId, "Product ID");
    this.validateId(variantId, "Variant ID");
    this.validateBusinessId(businessId);

    const deletedVariant = await this.repository.delete(
      productId,
      variantId,
      businessId,
    );

    this.validateReturnedVariant(deletedVariant, productId, businessId);

    if (deletedVariant.status !== "inactive") {
      throw new Error("Product variant was not successfully deactivated.");
    }

    return deletedVariant;
  }

  private normalizeCreateData(
    data: CreateProductVariantInput,
  ): CreateProductVariantInput {
    const barcode = data.barcode?.trim() || null;

    return {
      ...data,
      sku: data.sku.trim().toUpperCase(),
      barcode,
      barcodeType: barcode ? (data.barcodeType ?? null) : null,
      attributes: this.normalizeAttributes(data.attributes),
      currency: data.currency ?? "USD",
      stockQuantity: data.stockQuantity ?? 0,
      minimumStock: data.minimumStock ?? 0,
      status: data.status ?? "active",
    };
  }

  private normalizeUpdateData(
    data: UpdateProductVariantInput,
  ): UpdateProductVariantInput {
    const normalized: UpdateProductVariantInput = {
      ...data,
    };

    if (data.sku !== undefined) {
      normalized.sku = data.sku.trim().toUpperCase();
    }

    if (data.attributes !== undefined) {
      normalized.attributes = this.normalizeAttributes(data.attributes);
    }

    if (data.barcode !== undefined) {
      normalized.barcode = data.barcode?.trim() || null;

      if (!normalized.barcode) {
        normalized.barcodeType = null;
      }
    }

    return normalized;
  }

  private normalizeAttributes(
    attributes: ProductVariantAttribute[],
  ): ProductVariantAttribute[] {
    return attributes.map((attribute) => ({
      name: attribute.name.trim(),
      value: attribute.value.trim(),
    }));
  }

  private validateCreateData(data: CreateProductVariantInput): void {
    if (!data || typeof data !== "object") {
      throw new Error("Variant data is required.");
    }

    this.validateSku(data.sku);
    this.validateAttributes(data.attributes);
    this.validatePrice(data.costPrice, "Cost price");
    this.validatePrice(data.sellingPrice, "Selling price");
    this.validateStock(data.stockQuantity, "Stock quantity");
    this.validateStock(data.minimumStock, "Minimum stock");

    const barcode = data.barcode?.trim() || null;
    const barcodeType = barcode ? (data.barcodeType ?? null) : null;

    this.validateBarcode(barcode, barcodeType);

    if (
      data.currency !== undefined &&
      !["USD", "KHR"].includes(data.currency)
    ) {
      throw new Error("Invalid product currency.");
    }

    if (
      data.status !== undefined &&
      !["active", "inactive"].includes(data.status)
    ) {
      throw new Error("Invalid product variant status.");
    }
  }

  private validateUpdateData(data: UpdateProductVariantInput): void {
    if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
      throw new Error("At least one variant field is required for update.");
    }

    if (data.sku !== undefined) {
      this.validateSku(data.sku);
    }

    if (data.attributes !== undefined) {
      this.validateAttributes(data.attributes);
    }

    if (data.costPrice !== undefined) {
      this.validatePrice(data.costPrice, "Cost price");
    }

    if (data.sellingPrice !== undefined) {
      this.validatePrice(data.sellingPrice, "Selling price");
    }


    if (data.minimumStock !== undefined) {
      this.validateStock(data.minimumStock, "Minimum stock");
    }

    if (data.barcode !== undefined || data.barcodeType !== undefined) {
      const barcode =
        data.barcode === undefined ? undefined : data.barcode?.trim() || null;

      const barcodeType =
        barcode === undefined
          ? (data.barcodeType ?? null)
          : barcode
            ? (data.barcodeType ?? null)
            : null;

      if (barcode !== undefined) {
        this.validateBarcode(barcode, barcodeType);
      } else if (data.barcodeType !== null && data.barcodeType !== undefined) {
        this.validateBarcode("barcode", data.barcodeType);
      }
    }

    if (
      data.currency !== undefined &&
      !["USD", "KHR"].includes(data.currency)
    ) {
      throw new Error("Invalid product currency.");
    }

    if (
      data.status !== undefined &&
      !["active", "inactive"].includes(data.status)
    ) {
      throw new Error("Invalid product variant status.");
    }
  }

  private validateSku(sku: string): void {
    const normalized = sku?.trim().toUpperCase();

    if (
      !normalized ||
      normalized.length > 50 ||
      !/^[A-Z0-9][A-Z0-9_-]*$/.test(normalized)
    ) {
      throw new Error(
        "SKU must contain 1 to 50 letters, numbers, underscores, or hyphens.",
      );
    }
  }

  private validateAttributes(attributes: ProductVariantAttribute[]): void {
    if (
      !Array.isArray(attributes) ||
      attributes.length === 0 ||
      attributes.length > 20
    ) {
      throw new Error("A variant requires between 1 and 20 attributes.");
    }

    const names = new Set<string>();

    for (const attribute of attributes) {
      const name = attribute.name?.trim();
      const value = attribute.value?.trim();

      if (!name || name.length > 50 || !value || value.length > 100) {
        throw new Error("Invalid variant attribute.");
      }

      const normalizedName = name.toLowerCase();

      if (names.has(normalizedName)) {
        throw new Error("Duplicate attribute names are not allowed.");
      }

      names.add(normalizedName);
    }
  }

  private validatePrice(value: number, field: string): void {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`${field} must be a valid non-negative number.`);
    }
  }

  private validateStock(value: number | undefined, field: string): void {
    if (value !== undefined && (!Number.isInteger(value) || value < 0)) {
      throw new Error(`${field} must be a non-negative integer.`);
    }
  }

  private validateBarcode(
    barcode: string | null,
    barcodeType: BarcodeType | null,
  ): void {
    if (barcode && !barcodeType) {
      throw new Error("Barcode type is required when a barcode is provided.");
    }

    if (!barcode && barcodeType) {
      throw new Error("Barcode type must be empty when barcode is empty.");
    }
  }

  private validateReturnedVariant(
    variant: ProductVariant,
    productId: string,
    businessId: string,
  ): void {
    if (variant.productId !== productId) {
      throw new Error(
        "Product variant does not belong to the requested product.",
      );
    }

    if (variant.businessId !== businessId) {
      throw new Error(
        "Product variant does not belong to the requested business.",
      );
    }
  }

  private validateId(id: string, field: string): void {
    if (!id?.trim()) {
      throw new Error(`${field} is required.`);
    }
  }

  private validateBusinessId(businessId: string): void {
    if (!businessId?.trim()) {
      throw new Error("Business ID is required.");
    }
  }
}

export default function useProductVariantService() {
  const repository = createProductVariantApiRepository();

  return new ProductVariantService(repository);
}
