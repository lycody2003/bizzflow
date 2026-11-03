
import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface BusinessDocument extends Document {
  name: string;
  logoUrl: string | null;
  logoPublicId: string | null;
  ownerId: Types.ObjectId;
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

const businessSchema = new Schema<BusinessDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 150,
    },

    logoUrl: {
      type: String,
      default: null,
    },

    logoPublicId: {
      type: String,
      default: null,
    },

    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
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

businessSchema.index({ ownerId: 1 }, { unique: true });

const Business =
  mongoose.models.Business ||
  mongoose.model<BusinessDocument>("Business", businessSchema);

export default Business;
