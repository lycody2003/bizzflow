import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface UserDocument extends Document {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  businessId: Types.ObjectId;
  avatarUrl: string | null;
  avatarPublicId: string | null;
  status: "active" | "inactive" | "suspended";
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },

    avatarUrl: {
      type: String,
      default: null,
    },

    avatarPublicId: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

userSchema.index({ email: 1 }, { unique: true });

userSchema.set("toJSON", {
  transform: (_document, returnedObject) => {
    const { passwordHash, ...safeObject } = returnedObject;

    return safeObject;
  },
});

const User =
  mongoose.models.User || mongoose.model<UserDocument>("User", userSchema);

export default User;
