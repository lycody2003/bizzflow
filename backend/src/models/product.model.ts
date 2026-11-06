import mongoose, { Schema, type Document, type Types } from "mongoose";

export type ProductStatus = "active" | "inactive";
export type ProductType = "standard" | "variant";
export type BarcodeType = "EAN13" | "UPC" | "EAN8" | "CODE128" | "QR";
export type ProductCurrency = "USD" | "KHR";

export interface ProductAttributeDefinition {
  name: string;
  values: string[];
}

export interface ProductDocument extends Document {
  name: string;
  sku: string | null;
  barcode: string | null;
  barcodeType: BarcodeType | null;
  description: string;
  category: Types.ObjectId;
  type: ProductType;
  attributeDefinitions: ProductAttributeDefinition[];
  unit: Types.ObjectId;
  costPrice: number | null;
  sellingPrice: number | null;
  currency: ProductCurrency;
  stockQuantity: number | null;
  minimumStock: number | null;
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
      default: null,
      trim: true,
      uppercase: true,
      minlength: 1,
      maxlength: 50,
      required: function (this: ProductDocument) {
        return this.type === "standard";
      },
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
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true
    },
    type: {
      type: String,
      enum: ["standard", "variant"],
      default: "standard",
    },
    attributeDefinitions: {
      type: [
        {
          name: {
            type: String,
            required: true,
            trim: true,
          },
          values: {
            type: [String],
            required: true,
            validate: {
              validator: (values: string[]) => values.length > 0,
              message: "Each attribute must have at least one value",
            },
          },
        },
      ],
      default: [],
    },
    unit: {
      type: Schema.Types.ObjectId,
      ref: "Unit",
      required: true,
    },
    costPrice: {
      type: Number,
      default: null,
      min: 0,
      required: function (this: ProductDocument) {
        return this.type === "standard";
      },
    },
    sellingPrice: {
      type: Number,
      default: null,
      min: 0,
      required: function (this: ProductDocument) {
        return this.type === "standard";
      },
    },
    currency: {
      type: String,
      enum: ["USD", "KHR"],
      default: "USD",
    },
    stockQuantity: {
      type: Number,
      default: null,
      min: 0,
      required: function (this: ProductDocument) {
        return this.type === "standard";
      },
      validate: {
        validator: (value: number | null) =>
          value === null || Number.isInteger(value),
        message: "Stock quantity must be an integer",
      },
    },
    minimumStock: {
      type: Number,
      default: null,
      min: 0,
      required: function (this: ProductDocument) {
        return this.type === "standard";
      },
      validate: {
        validator: (value: number | null) =>
          value === null || Number.isInteger(value),
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

// Standard Product SKUs must be unique within the same business.
// Variant Parent products do not own a sellable SKU.
productSchema.index(
  { businessId: 1, sku: 1 },
  {
    unique: true,
    partialFilterExpression: {
      sku: { $type: "string" },
    },
  },
);

// Support business-scoped product listing and sorting.
productSchema.index({ businessId: 1, createdAt: -1 });

const Product =
  mongoose.models.Product ||
  mongoose.model<ProductDocument>("Product", productSchema);

export default Product;
