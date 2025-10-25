import { generateAccessToken } from "../utils/jwt.util.js";
import { emailService } from "./email.service.js";
import prisma from "../config/database.js";
import { logger } from "../config/logger.js";

export class EmailVerificationService {
  async sendVerificationEmail(
    userId: string,
    email: string,
    firstName: string
  ) {
    // Generate verification token
    const verificationToken = generateAccessToken({
      sub: userId,
      org: "",
      email: email,
      role: "VIEWER",
      permissions: [],
    });

    // Store verification token in database (expires in 24 hours)
    await prisma.emailVerification.create({
      data: {
        userId,
        token: verificationToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    // Send verification email
    try {
      await emailService.sendEmailVerification(
        email,
        verificationToken,
        firstName
      );
      logger.info(`Verification email sent to ${email}`);
    } catch (error) {
      logger.error("Failed to send verification email:", error);
      throw new Error("Failed to send verification email");
    }
  }

  async verifyEmail(token: string) {
    // Find valid verification token
    const verification = await prisma.emailVerification.findFirst({
      where: {
        token,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!verification) {
      throw new Error("Invalid or expired verification token");
    }

    // Check if user is already verified to prevent duplicate welcome emails
    const wasAlreadyVerified = verification.user.emailVerified;

    // Update user email verification status
    await prisma.user.update({
      where: { id: verification.userId },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });

    // Delete verification token (with error handling for duplicate requests)
    try {
      await prisma.emailVerification.delete({
        where: { id: verification.id },
      });
    } catch (error) {
      // If record doesn't exist, it might have been deleted already (duplicate request)
      // This is not a critical error, so we can continue
      logger.warn(
        `Email verification token already deleted for user ${verification.userId}`
      );
    }

    // Send welcome email only if user was just verified (not already verified)
    if (!wasAlreadyVerified) {
      try {
        await emailService.sendWelcomeEmail(
          verification.user.email,
          verification.user.firstName,
          verification.user.organization.name
        );
        logger.info(`Welcome email sent to ${verification.user.email}`);
      } catch (error) {
        // Log error but don't fail the verification
        logger.error("Failed to send welcome email:", error);
      }
    } else {
      logger.info(
        `User ${verification.userId} was already verified, skipping welcome email`
      );
    }

    logger.info(`Email verified for user ${verification.userId}`);
    return verification.user;
  }
}

export const emailVerificationService = new EmailVerificationService();
