import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface UnitDocument extends Document {
  name: string;
  symbol: string;
  businessId: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const unitSchema = new Schema<UnitDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100,
    },
    symbol: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 20,
    },
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

unitSchema.index(
  { businessId: 1, name: 1 },
  { unique: true },
);

unitSchema.index(
  { businessId: 1, symbol: 1 },
  { unique: true },
);

const Unit =
  mongoose.models.Unit ||
  mongoose.model<UnitDocument>("Unit", unitSchema);

export default Unit;
