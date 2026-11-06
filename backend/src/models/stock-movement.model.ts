import mongoose, { Schema, type Document, type Types } from "mongoose";

export type StockMovementType =
  | "opening"
  | "adjustment_in"
  | "adjustment_out";

export interface StockMovementDocument extends Document {
  businessId: Types.ObjectId;
  productId: Types.ObjectId;
  variantId?: Types.ObjectId;
  type: StockMovementType;
  quantity: number;
  quantityBefore: number;
  quantityAfter: number;
  reason: string;
  performedBy: Types.ObjectId;
  idempotencyKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const stockMovementSchema = new Schema<StockMovementDocument>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    variantId: {
      type: Schema.Types.ObjectId,
      ref: "ProductVariant",
    },
    type: {
      type: String,
      enum: ["opening", "adjustment_in", "adjustment_out"],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: (value: number) => Number.isInteger(value),
        message: "Movement quantity must be a positive integer",
      },
    },
    quantityBefore: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: (value: number) => Number.isInteger(value),
        message: "Quantity before must be a non-negative integer",
      },
    },
    quantityAfter: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: (value: number) => Number.isInteger(value),
        message: "Quantity after must be a non-negative integer",
      },
    },
    reason: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    idempotencyKey: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Prevent duplicate adjustment requests within a business.
stockMovementSchema.index(
  { businessId: 1, idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: {
      idempotencyKey: { $type: "string" },
    },
  },
);

// Support business-scoped movement history.
stockMovementSchema.index({
  businessId: 1,
  createdAt: -1,
});

// Support product movement history.
stockMovementSchema.index({
  businessId: 1,
  productId: 1,
  createdAt: -1,
});

// Support variant movement history.
stockMovementSchema.index({
  businessId: 1,
  variantId: 1,
  createdAt: -1,
});

const StockMovement =
  mongoose.models.StockMovement ||
  mongoose.model<StockMovementDocument>(
    "StockMovement",
    stockMovementSchema,
  );

export default StockMovement;