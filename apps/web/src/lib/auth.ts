import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { apiClient } from "./api-client";
import type { AuthResponse } from "@/types";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const response = await apiClient.post<{
            success: boolean;
            data: AuthResponse;
          }>("/auth/login", {
            email: credentials.email,
            password: credentials.password,
          });

          if (response.success && response.data) {
            const { user, organization, requires2FA } = response.data;

            // Check if 2FA is required
            if (requires2FA) {
              throw new Error("2FA_REQUIRED");
            }

            // Tokens are now in HTTP-only cookies (set by backend)

            return {
              id: user.id,
              email: user.email,
              name: `${user.firstName} ${user.lastName}`,
              image: user.avatar,
              organizationId: organization.id,
              organizationName: organization.name,
            };
          }

          return null;
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email || "";
        token.organizationId = user.organizationId;
        token.organizationName = user.organizationName;
        // Tokens are now in HTTP-only cookies, not in NextAuth session
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.organizationId = token.organizationId;
        session.organizationName = token.organizationName;
        // Tokens are now in HTTP-only cookies, not in session
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
