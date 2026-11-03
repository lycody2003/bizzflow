import mongoose from "mongoose";

import configEnv from "@configs/env";
import User from "@models/user.model";
import Business from "@models/business.model";
import RefreshToken from "@models/refresh-token.model";
import AppError from "@shared-errors/app.error";

import passwordService from "@services/auth/password.service";
import tokenService from "@services/auth/token.service";

interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface AuthResult {
  user: Record<string, unknown>;
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: string;
}

class AuthService {
  async register(input: RegisterInput): Promise<AuthResult> {
    const firstName = input.firstName.trim();
    const lastName = input.lastName.trim();
    const email = input.email.trim().toLowerCase();

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new AppError("Email is already registered", 409);
    }

    const passwordHash = await passwordService.hashPassword(input.password);

    const session = await mongoose.startSession();

    let result: AuthResult | null = null;

    try {
      await session.withTransaction(async () => {
        // Generate IDs first so both documents can reference each other.
        const userId = new mongoose.Types.ObjectId();
        const businessId = new mongoose.Types.ObjectId();

        const businessName = `${firstName} ${lastName}'s Business`;

        // Create Business with the future User ID as owner.
        const [business] = await Business.create(
          [
            {
              _id: businessId,
              name: businessName,
              ownerId: userId,
              status: "active",
            },
          ],
          { session },
        );

        // Create User with the Business ID.
        const [user] = await User.create(
          [
            {
              _id: userId,
              firstName,
              lastName,
              email,
              passwordHash,
              businessId: business._id,
            },
          ],
          { session },
        );

        const refreshTokenData = tokenService.generateRefreshToken();

        await RefreshToken.create(
          [
            {
              userId: user._id,
              tokenHash: refreshTokenData.tokenHash,
              expiresAt: refreshTokenData.expiresAt,
            },
          ],
          { session },
        );

        result = {
          user: user.toJSON() as Record<string, unknown>,
          accessToken: tokenService.generateAccessToken({
            userId: user._id.toString(),
            email: user.email,
          }),
          refreshToken: refreshTokenData.token,
          tokenType: "Bearer",
          expiresIn: configEnv.JWT_ACCESS_EXPIRES_IN,
        };
      });

      if (!result) {
        throw new AppError("Registration failed", 500);
      }

      return result;
    } catch (error) {
      if (
        error instanceof mongoose.mongo.MongoServerError &&
        error.code === 11000
      ) {
        throw new AppError("Email is already registered", 409);
      }

      throw error;
    } finally {
      await session.endSession();
    }
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const email = input.email.trim().toLowerCase();

    const user = await User.findOne({ email }).select("+passwordHash");

    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    const isPasswordValid = await passwordService.comparePassword(
      input.password,
      user.passwordHash,
    );

    if (!isPasswordValid || user.status !== "active") {
      throw new AppError("Invalid email or password", 401);
    }

    if (!user.businessId) {
      throw new AppError("User business is not available", 403);
    }

    const refreshTokenData = tokenService.generateRefreshToken();

    await RefreshToken.create({
      userId: user._id,
      tokenHash: refreshTokenData.tokenHash,
      expiresAt: refreshTokenData.expiresAt,
    });

    user.lastLoginAt = new Date();
    await user.save();

    return {
      user: user.toJSON() as Record<string, unknown>,
      accessToken: tokenService.generateAccessToken({
        userId: user._id.toString(),
        email: user.email,
      }),
      refreshToken: refreshTokenData.token,
      tokenType: "Bearer",
      expiresIn: configEnv.JWT_ACCESS_EXPIRES_IN,
    };
  }

  async refresh(refreshToken: string): Promise<AuthResult> {
    if (!refreshToken) {
      throw new AppError("Refresh token is required", 401);
    }

    const oldTokenHash = tokenService.hashToken(refreshToken);
    const session = await mongoose.startSession();

    let result: AuthResult | null = null;
    let reuseDetected = false;

    try {
      await session.withTransaction(async () => {
        const storedToken = await RefreshToken.findOne({
          tokenHash: oldTokenHash,
        })
          .select("+tokenHash +replacedByTokenHash")
          .session(session);

        if (!storedToken) {
          throw new AppError("Invalid or expired refresh token", 401);
        }

        if (storedToken.revokedAt) {
          if (storedToken.replacedByTokenHash) {
            await RefreshToken.updateMany(
              {
                userId: storedToken.userId,
                revokedAt: null,
              },
              {
                $set: {
                  revokedAt: new Date(),
                },
              },
              { session },
            );

            reuseDetected = true;
            return;
          }

          throw new AppError("Invalid or expired refresh token", 401);
        }

        if (storedToken.expiresAt.getTime() <= Date.now()) {
          throw new AppError("Invalid or expired refresh token", 401);
        }

        const user = await User.findById(storedToken.userId).session(session);

        if (!user || user.status !== "active" || !user.businessId) {
          throw new AppError("Invalid or expired refresh token", 401);
        }

        const newRefreshToken = tokenService.generateRefreshToken();

        storedToken.revokedAt = new Date();
        storedToken.replacedByTokenHash = newRefreshToken.tokenHash;

        await storedToken.save({ session });

        await RefreshToken.create(
          [
            {
              userId: user._id,
              tokenHash: newRefreshToken.tokenHash,
              expiresAt: newRefreshToken.expiresAt,
            },
          ],
          { session },
        );

        result = {
          user: user.toJSON() as Record<string, unknown>,
          accessToken: tokenService.generateAccessToken({
            userId: user._id.toString(),
            email: user.email,
          }),
          refreshToken: newRefreshToken.token,
          tokenType: "Bearer",
          expiresIn: configEnv.JWT_ACCESS_EXPIRES_IN,
        };
      });

      if (reuseDetected) {
        throw new AppError(
          "Refresh token reuse detected. Please login again.",
          401,
        );
      }

      if (!result) {
        throw new AppError("Token refresh failed", 401);
      }

      return result;
    } finally {
      await session.endSession();
    }
  }

  async logout(refreshToken: string): Promise<void> {
    if (!refreshToken) {
      return;
    }

    const tokenHash = tokenService.hashToken(refreshToken);

    await RefreshToken.updateOne(
      {
        tokenHash,
        revokedAt: null,
      },
      {
        $set: {
          revokedAt: new Date(),
        },
      },
    );
  }

  async getCurrentUser(
    userId: string,
  ): Promise<Record<string, unknown>> {
    if (!mongoose.isValidObjectId(userId)) {
      throw new AppError("User not found", 404);
    }

    const user = await User.findById(userId);

    if (!user || user.status !== "active") {
      throw new AppError("User not found", 404);
    }

    if (!user.businessId) {
      throw new AppError("User business is not available", 403);
    }

    const business = await Business.findOne({
      _id: user.businessId,
      ownerId: user._id,
      status: "active",
    });

    if (!business) {
      throw new AppError("Business not found", 404);
    }

    return {
      ...user.toJSON(),
      business: {
        id: business._id.toString(),
        name: business.name,
        status: business.status,
      },
    };
  }
}

export default new AuthService();