import mongoose, { ObjectId, Schema, type Document, type Types } from "mongoose";

export type ProductStatus = "active" | "inactive";
export type ProductType = "standard" | "variant";
export type BarcodeType = "EAN13" | "UPC" | "EAN8" | "CODE128" | "QR";
export type ProductCurrency = "USD" | "KHR";

export interface ProductDocument extends Document {
  name: string;
  sku: string;
  barcode: string | null;
  barcodeType: BarcodeType | null;
  description: string;
  category: string;
  categoryId: ObjectId;
  type: ProductType;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  currency: ProductCurrency;
  stockQuantity: number;
  minimumStock: number;
  status: ProductStatus;
  imageUrl: string | null;
  imagePublicId: string | null;
  businessId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<ProductDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 150,
    },
    sku: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      minlength: 1,
      maxlength: 50,
    },
    barcode: {
      type: String,
      trim: true,
      default: null,
    },
    barcodeType: {
      type: String,
      enum: ["EAN13", "UPC", "EAN8", "CODE128", "QR", null],
      default: null,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true
    },
    type: {
      type: String,
      enum: ["standard", "variant"],
      default: "standard",
    },
    unit: {
      type: String,
      trim: true,
      maxlength: 30,
      default: "piece",
    },
    costPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    sellingPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      enum: ["USD", "KHR"],
      default: "USD",
    },
    stockQuantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: "Stock quantity must be an integer",
      },
    },
    minimumStock: {
      type: Number,
      min: 0,
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: "Minimum stock must be an integer",
      },
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    imageUrl: {
      type: String,
      default: null,
    },
    imagePublicId: {
      type: String,
      default: null,
    },
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// SKU must be unique only within the same business.
productSchema.index({ businessId: 1, sku: 1 }, { unique: true });

// Support business-scoped product listing and sorting.
productSchema.index({ businessId: 1, createdAt: -1 });

const Product =
  mongoose.models.Product ||
  mongoose.model<ProductDocument>("Product", productSchema);

export default Product;
