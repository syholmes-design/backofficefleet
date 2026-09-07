import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { NextResponse } from "next/server";

import {
  isDatabaseUrlConfigured,
  isDatabaseUrlNotConfiguredError,
  prisma,
} from "@/lib/prisma";

export const AUTH_SECRET_REQUIRED_CODE = "AUTH_SECRET_REQUIRED" as const;

export function getConfiguredAuthSecret(): string | null {
  const raw =
    process.env.AUTH_SECRET ?? process.env.AUTH_AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  return trimmed.length > 0 ? trimmed : null;
}

export function authSecretUnavailablePayload() {
  return {
    error: "AUTH_SECRET is not configured",
    code: AUTH_SECRET_REQUIRED_CODE,
  };
}

function authSecretUnavailableResponse() {
  return NextResponse.json(authSecretUnavailablePayload(), { status: 503 });
}

const authSecret = getConfiguredAuthSecret();

const nextAuth = authSecret
  ? NextAuth({
      secret: authSecret,
      ...(isDatabaseUrlConfigured() ? { adapter: PrismaAdapter(prisma) } : {}),
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

            if (!isDatabaseUrlConfigured()) {
              throw new Error("DATABASE_URL is not configured");
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
            if (!isDatabaseUrlConfigured()) {
              return {
                ...session,
                user: {
                  ...session.user,
                  id: token.sub,
                  memberships: [],
                },
              };
            }

            try {
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
            } catch (error) {
              if (isDatabaseUrlNotConfiguredError(error)) {
                return {
                  ...session,
                  user: {
                    ...session.user,
                    id: token.sub,
                    memberships: [],
                  },
                };
              }
              throw error;
            }
          }

          return session;
        },
      },
    })
  : null;

export const handlers = nextAuth?.handlers ?? {
  GET: async () => authSecretUnavailableResponse(),
  POST: async () => authSecretUnavailableResponse(),
};

export const auth = nextAuth?.auth ?? (async () => null);

export const signIn =
  nextAuth?.signIn ??
  (async () => {
    throw new Error("AUTH_SECRET is not configured");
  });

export const signOut =
  nextAuth?.signOut ??
  (async () => {
    throw new Error("AUTH_SECRET is not configured");
  });
