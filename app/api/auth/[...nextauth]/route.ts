// app/api/auth/[...nextauth]/route.ts
// REPLACE YOUR ENTIRE FILE WITH THIS CONTENT

import NextAuth from "next-auth";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Extend the default session and JWT types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("Missing credentials");
          return null;
        }

        console.log("Attempting to authenticate:", credentials.email);

        // TEMPORARY: Simple hardcoded authentication for testing
        // Replace this with your actual database verification later
        const validUsers = [
          { email: "admin@test.com", password: "admin123", role: "admin" },
          {
            email: "india@test.com",
            password: "india123",
            role: "india_admin",
          },
          {
            email: "france@test.com",
            password: "france123",
            role: "france_admin",
          },
          { email: "us@test.com", password: "us123", role: "us_admin" },
        ];

        const user = validUsers.find(
          (u) =>
            u.email === credentials.email && u.password === credentials.password
        );

        if (user) {
          console.log("Authentication successful for:", user.email);
          return {
            id: Date.now().toString(), // Simple ID generation
            email: user.email,
            name: user.email.split("@")[0], // Use email prefix as name
            role: user.role,
          };
        }

        console.log("Authentication failed for:", credentials.email);
        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/sign-in",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
