import speakeasy from "speakeasy";
import qrcode from "qrcode";
import prisma from "../config/database.js";
import { AuthenticationError } from "../utils/errors.util.js";
import { logger } from "../config/logger.js";

export class TwoFactorService {
  /**
   * Generate 2FA secret and QR code for user
   */
  async generateSecret(userId: string, email: string) {
    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `LogicorpTMS (${email})`,
      issuer: "LogicorpTMS",
      length: 32,
    });

    // Generate QR code
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url!);

    // Store secret in database (not yet enabled)
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: secret.base32,
        twoFactorEnabled: false, // Not enabled until verified
      },
    });

    logger.info(`2FA secret generated for user ${userId}`);

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
      otpauthUrl: secret.otpauth_url,
    };
  }

  /**
   * Enable 2FA after verifying the first token
   */
  async enable2FA(userId: string, token: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.twoFactorSecret) {
      throw new AuthenticationError("2FA not set up for this user");
    }

    // Verify the token
    const isValid = this.verifyToken(user.twoFactorSecret, token);

    if (!isValid) {
      throw new AuthenticationError("Invalid 2FA token");
    }

    // Enable 2FA
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
      },
    });

    logger.info(`2FA enabled for user ${userId}`);

    return { message: "2FA enabled successfully" };
  }

  /**
   * Disable 2FA
   */
  async disable2FA(userId: string, token: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.twoFactorSecret) {
      throw new AuthenticationError("2FA not enabled for this user");
    }

    // Verify the token before disabling
    const isValid = this.verifyToken(user.twoFactorSecret, token);

    if (!isValid) {
      throw new AuthenticationError("Invalid 2FA token");
    }

    // Disable 2FA
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    logger.info(`2FA disabled for user ${userId}`);

    return { message: "2FA disabled successfully" };
  }

  /**
   * Verify 2FA token
   */
  verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
      window: 2, // Allow 2 time steps before/after for clock skew
    });
  }

  /**
   * Verify 2FA token for user
   */
  async verifyUserToken(userId: string, token: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return false;
    }

    return this.verifyToken(user.twoFactorSecret, token);
  }
}

export const twoFactorService = new TwoFactorService();
