import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { UserType } from "@prisma/client";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    // Email/Password Provider
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        userType: { label: "User Type", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Handle hardcoded admin credentials
        if (credentials.email === "admin@carebridge.com" && credentials.password === "admin@123") {
          return {
            id: "admin",
            email: "admin@carebridge.com",
            name: "System Administrator",
            userType: "ADMIN",
            image: null,
          };
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            patient: true,
            nurse: true,
            doctor: true,
            admin: true
          }
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          userType: user.userType,
          image: user.image,
        };
      },
    }),

    // Google OAuth Provider (disabled until properly configured)
    ...(process.env.GOOGLE_CLIENT_ID &&
        process.env.GOOGLE_CLIENT_SECRET &&
        process.env.GOOGLE_CLIENT_ID !== "placeholder-client-id-not-configured" &&
        process.env.GOOGLE_CLIENT_SECRET !== "placeholder-secret-not-configured" &&
        process.env.GOOGLE_CLIENT_ID !== "your-google-client-id" &&
        process.env.GOOGLE_CLIENT_SECRET !== "your-google-client-secret"
      ? [GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        })]
      : []),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.userType = user.userType;
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.userType = token.userType as UserType;
      }
      return session;
    },

    async signIn({ user, account, profile }) {
      // For OAuth providers, create user profile if doesn't exist
      if (account?.provider === "google" && profile?.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: profile.email }
        });

        if (!existingUser) {
          // Create new user with default PATIENT type
          await prisma.user.create({
            data: {
              email: profile.email,
              name: profile.name || "",
              image: (profile as any).picture,
              userType: UserType.PATIENT,
              emailVerified: new Date(),
            }
          });
        }
      }
      return true;
    },
  },

  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },

  secret: process.env.NEXTAUTH_SECRET,
};

// Type augmentation for NextAuth
declare module "next-auth" {
  interface User {
    userType: UserType;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      userType: UserType;
      image?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userType: UserType;
  }
}
