
import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface InventoryBalanceDocument extends Document {
  businessId: Types.ObjectId;
  productId: Types.ObjectId;
  variantId?: Types.ObjectId;
  quantityOnHand: number;
  createdAt: Date;
  updatedAt: Date;
}

const inventoryBalanceSchema = new Schema<InventoryBalanceDocument>(
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
    quantityOnHand: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      validate: {
        validator: (value: number) => Number.isInteger(value),
        message: "Quantity on hand must be an integer",
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// One balance per standard product or variant within a business.
inventoryBalanceSchema.index(
  {
    businessId: 1,
    productId: 1,
    variantId: 1,
  },
  {
    unique: true,
    name: "business_product_variant_unique",
  },
);

// Useful for listing inventory balances by business.
inventoryBalanceSchema.index({
  businessId: 1,
  updatedAt: -1,
});

const InventoryBalance =
  mongoose.models.InventoryBalance ||
  mongoose.model<InventoryBalanceDocument>(
    "InventoryBalance",
    inventoryBalanceSchema,
  );

export default InventoryBalance;
