import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import bcrypt from "bcryptjs"
import { prisma } from "./prisma"

/**
 * 扩展 NextAuth Session 类型
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      familyId: string | null
      familyRole: string | null
    }
  }

  interface User {
    id: string
    email: string
    name: string
    role: string
    familyId: string | null
    familyRole?: string | null
  }
}

/**
 * 扩展 NextAuth JWT 类型
 */
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

/**
 * 获取用户在当前家庭中的角色
 */
async function getUserFamilyRole(userId: string, familyId: string | null): Promise<string | null> {
  if (!familyId) return null

  const familyMember = await prisma.familyMember.findUnique({
    where: {
      familyId_userId: {
        familyId,
        userId,
      },
    },
  })

  return familyMember?.role ?? null
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("邮箱和密码必填")
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user) {
          throw new Error("用户不存在")
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!passwordMatch) {
          throw new Error("密码错误")
        }

        // 获取家庭角色
        const familyRole = await getUserFamilyRole(user.id, user.familyId)

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          familyId: user.familyId,
          familyRole,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // 首次登录时添加用户信息
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.role = user.role
        token.familyId = user.familyId
        token.familyRole = user.familyRole ?? null
      }

      // 更新会话时 (如切换家庭)
      if (trigger === "update" && session) {
        token.familyId = session.familyId as string
        token.familyRole = session.familyRole as string
      }

      return token
    },
    async session({ session, token }) {
      session.user = {
        id: token.id,
        email: token.email,
        name: token.name,
        role: token.role,
        familyId: token.familyId,
        familyRole: token.familyRole,
      }
      return session
    },
  },
}
