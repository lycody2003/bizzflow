
import mongoose, { Schema, type Document, type Types } from "mongoose";

export type SkuReferenceType = "product" | "variant";

export interface SkuRegistryDocument extends Document {
  businessId: Types.ObjectId;
  sku: string;
  referenceType: SkuReferenceType;
  referenceId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const skuRegistrySchema = new Schema<SkuRegistryDocument>(
  {
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
      minlength: 1,
      maxlength: 50,
    },
    referenceType: {
      type: String,
      enum: ["product", "variant"],
      required: true,
    },
    referenceId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

skuRegistrySchema.index(
  { businessId: 1, sku: 1 },
  { unique: true },
);

skuRegistrySchema.index(
  { businessId: 1, referenceType: 1, referenceId: 1 },
  { unique: true },
);

const SkuRegistry =
  mongoose.models.SkuRegistry ||
  mongoose.model<SkuRegistryDocument>(
    "SkuRegistry",
    skuRegistrySchema,
  );

export default SkuRegistry;
