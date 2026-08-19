import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      memberships: Array<{
        fleetId: string;
        fleetSlug: string;
        roleCode: string;
      }>;
    } & DefaultSession["user"];
  }

  interface User {
    memberships?: Array<{
      fleetId: string;
      fleetSlug: string;
      roleCode: string;
    }>;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    memberships?: Array<{
      fleetId: string;
      fleetSlug: string;
      roleCode: string;
    }>;
  }
}
