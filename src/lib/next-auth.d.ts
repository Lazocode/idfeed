import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      lojaId: string;
      papel: string;
      lojaStatus: string;
    } & DefaultSession["user"];
  }
}
