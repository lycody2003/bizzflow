import { createHash, randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";

import configEnv from "@configs/env";
import AppError from "@shared-errors/app.error";

interface AccessTokenPayload {
  sub: string;
  email: string;
  type: "access";
}

interface VerifiedAccessToken {
  userId: string;
  email: string;
}

interface RefreshTokenResult {
  token: string;
  tokenHash: string;
  expiresAt: Date;
}

class TokenService {
  generateAccessToken(payload: { userId: string; email: string }): string {
    const tokenPayload: AccessTokenPayload = {
      sub: payload.userId,
      email: payload.email,
      type: "access",
    };

    return jwt.sign(tokenPayload, configEnv.JWT_ACCESS_SECRET, {
      expiresIn:
        configEnv.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"],
      algorithm: "HS256",
    });
  }

  verifyAccessToken(token: string): VerifiedAccessToken {
    try {
      const decoded = jwt.verify(token, configEnv.JWT_ACCESS_SECRET, {
        algorithms: ["HS256"],
      });

      if (
        typeof decoded === "string" ||
        !decoded.sub ||
        typeof decoded.email !== "string" ||
        decoded.type !== "access"
      ) {
        throw new AppError("Invalid access token", 401);
      }

      return {
        userId: decoded.sub,
        email: decoded.email,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError("Invalid or expired access token", 401);
    }
  }

  generateRefreshToken(): RefreshTokenResult {
    const token = randomBytes(64).toString("hex");

    const tokenHash = this.hashToken(token);

    const expiresAt = new Date(
      Date.now() + configEnv.JWT_REFRESH_EXPIRES_IN_MS,
    );

    return {
      token,
      tokenHash,
      expiresAt,
    };
  }

  hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }
}

export default new TokenService();
