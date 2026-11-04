import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface CategoryDocument extends Document {
  name: string;
  icon?: string | null;
  businessId: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<CategoryDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    icon: {
      type: String,
      trim: true,
      default: null,
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

categorySchema.index(
  { businessId: 1, name: 1 },
  { unique: true },
);

const Category =
  mongoose.models.Category ||
  mongoose.model<CategoryDocument>("Category", categorySchema);

export default Category;
