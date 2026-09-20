import { User } from "firebase/auth";

export type AuthState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "forbidden"; email?: string | null }
  | { status: "authenticated"; user: User; uid: string; email: string };
