import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      familyId: string | null
      familyRole: string | null
      emailVerified: Date | null
    }
  }

  interface User {
    id: string
    email: string
    name: string
    role: string
    familyId: string | null
    familyRole: string | null
    emailVerified: Date | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    email: string
    name: string
    role: string
    familyId: string | null
    familyRole: string | null
  }
}
