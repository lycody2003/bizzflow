
import mongoose, { Schema, type Document } from 'mongoose'

export interface RefreshTokenDocument extends Document {
  userId: mongoose.Types.ObjectId
  tokenHash: string
  expiresAt: Date
  revokedAt?: Date | null
  replacedByTokenHash?: string | null
  createdAt: Date
  updatedAt: Date
}

const refreshTokenSchema = new Schema<RefreshTokenDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    replacedByTokenHash: {
      type: String,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
)

refreshTokenSchema.index({
  userId: 1,
  revokedAt: 1,
})

const RefreshToken =
  mongoose.models.RefreshToken ||
  mongoose.model<RefreshTokenDocument>(
    'RefreshToken',
    refreshTokenSchema,
  )

export default RefreshToken
