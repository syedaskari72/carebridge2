import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { UserType } from "@prisma/client";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  debug: process.env.APP_DEBUG === "1",
  logger: {
    error(code, metadata) {
      console.error("[NextAuth][error]", code, metadata);
    },
    warn(code) {
      console.warn("[NextAuth][warn]", code);
    },
    debug(code, metadata) {
      if (process.env.APP_DEBUG === "1") {
        console.log("[NextAuth][debug]", code, metadata);
      }
    },
  },
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
        console.log("[Auth][authorize] START", {
          hasEmail: !!credentials?.email,
          hasPassword: !!credentials?.password,
          email: credentials?.email
        });

        if (!credentials?.email || !credentials?.password) {
          console.log("[Auth][authorize] FAIL - missing credentials");
          return null;
        }

        // Handle admin credentials from environment variables
        if (credentials.email === process.env.ADMIN_EMAIL && credentials.password === process.env.ADMIN_PASSWORD) {
          console.log("[Auth][authorize] SUCCESS - admin login");
          return {
            id: "admin",
            email: process.env.ADMIN_EMAIL,
            name: "System Administrator",
            userType: "ADMIN",
            image: null,
          };
        }

        try {
          console.log("[Auth][authorize] Looking up user in database...");
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: {
              patient: true,
              nurse: true,
              doctor: true,
              admin: true
            }
          });

          console.log("[Auth][authorize] Database query result", {
            found: !!user,
            hasPassword: !!user?.password,
            userType: user?.userType
          });

          if (!user || !user.password) {
            console.log("[Auth][authorize] FAIL - user not found or no password");
            return null;
          }

          console.log("[Auth][authorize] Comparing passwords...");
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          console.log("[Auth][authorize] Password comparison result", { isPasswordValid });

          if (!isPasswordValid) {
            console.log("[Auth][authorize] FAIL - invalid password");
            return null;
          }

          const authUser = {
            id: user.id,
            email: user.email,
            name: user.name,
            userType: user.userType,
            image: user.image,
          };

          console.log("[Auth][authorize] SUCCESS - returning user", authUser);
          return authUser;

        } catch (error) {
          console.error("[Auth][authorize] ERROR", error);
          return null;
        }
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
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },

  callbacks: {
    async jwt({ token, user, account }) {
      console.log("[Auth][jwt] START", {
        hasUser: !!user,
        hasToken: !!token,
        provider: account?.provider,
        tokenSub: token?.sub,
        userFromAuth: user ? { id: (user as any).id, email: (user as any).email, userType: (user as any).userType } : null
      });

      if (user) {
        console.log("[Auth][jwt] Adding userType to token", { userType: (user as any).userType });
        token.userType = (user as any).userType;
      }

      console.log("[Auth][jwt] RESULT", {
        sub: token.sub,
        userType: (token as any).userType,
        email: token.email
      });
      return token;
    },

    async session({ session, token }) {
      console.log("[Auth][session] START", {
        hasToken: !!token,
        hasSession: !!session,
        tokenSub: token?.sub,
        tokenUserType: (token as any)?.userType,
        sessionUserEmail: session?.user?.email
      });

      if (token) {
        (session.user as any).id = token.sub!;
        (session.user as any).userType = (token as any).userType as UserType;
        console.log("[Auth][session] Updated session user", {
          id: (session.user as any).id,
          userType: (session.user as any).userType
        });
      }

      console.log("[Auth][session] RESULT", session);
      return session;
    },

    async signIn({ account, profile }) {
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
