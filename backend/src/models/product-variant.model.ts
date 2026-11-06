
import mongoose, { Schema, type Document, type Types } from "mongoose";

export type ProductVariantStatus = "active" | "inactive";

export interface ProductVariantAttribute {
  name: string;
  value: string;
}

export interface ProductVariantDocument extends Document {
  productId: Types.ObjectId;
  businessId: Types.ObjectId;
  sku: string;
  barcode: string | null;
  barcodeType: string | null;
  attributes: ProductVariantAttribute[];
  combinationKey?: string;
  costPrice: number;
  sellingPrice: number;
  currency: "USD" | "KHR";
  stockQuantity: number;
  minimumStock: number;
  status: ProductVariantStatus;
  createdAt: Date;
  updatedAt: Date;
}

const productVariantSchema = new Schema<ProductVariantDocument>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    sku: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    barcode: {
      type: String,
      trim: true,
      default: null,
    },
    barcodeType: {
      type: String,
      enum: ["EAN13", "UPC", "EAN8", "CODE128", "QR"],
      default: null,
    },
    combinationKey: {
      type: String,
      trim: true,
    },
    attributes: {
      type: [
        {
          name: {
            type: String,
            required: true,
            trim: true,
          },
          value: {
            type: String,
            required: true,
            trim: true,
          },
        },
      ],
      default: [],
    },
    costPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    sellingPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      enum: ["USD", "KHR"],
      required: true,
      default: "USD",
    },
    stockQuantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    minimumStock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

productVariantSchema.index(
  { businessId: 1, productId: 1 },
);

productVariantSchema.index(
  { businessId: 1, sku: 1 },
  { unique: true },
);

productVariantSchema.index(
  { businessId: 1, productId: 1, combinationKey: 1 },
  {
    unique: true,
    partialFilterExpression: {
      combinationKey: { $type: "string" },
    },
  },
);

productVariantSchema.index(
  { businessId: 1, barcode: 1 },
  {
    unique: true,
    partialFilterExpression: {
      barcode: { $type: "string" },
    },
  },
);

const ProductVariant =
  mongoose.models.ProductVariant ||
  mongoose.model<ProductVariantDocument>(
    "ProductVariant",
    productVariantSchema,
  );

export default ProductVariant;
