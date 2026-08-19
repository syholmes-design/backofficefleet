import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";

import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");

        if (!email || !password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            memberships: {
              include: {
                fleet: true,
                role: true,
              },
            },
          },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const passwordMatches = await compare(password, user.passwordHash);
        if (!passwordMatches) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }

      return token;
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        const userRecord = await prisma.user.findUnique({
          where: { id: token.sub },
          include: {
            memberships: {
              include: {
                fleet: true,
                role: true,
              },
            },
          },
        });

        const memberships = ((userRecord?.memberships ?? []) as Array<{
          status: string;
          fleetId: string;
          fleet: { slug: string };
          role: { code: string };
        }>)
          .filter((membership) => membership.status !== "INACTIVE" && membership.status !== "INVITED")
          .map((membership) => ({
            fleetId: membership.fleetId,
            fleetSlug: membership.fleet.slug,
            roleCode: membership.role.code,
          }));

        return {
          ...session,
          user: {
            ...session.user,
            id: token.sub,
            memberships,
          },
        };
      }

      return session;
    },
  },
});
