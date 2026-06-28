import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "House of EdTech Login",
      credentials: { 
        email: { label: "Email", type: "text" }, 
        password: { label: "Password", type: "password" } 
      },
      async authorize(credentials) {
        const VALID_PASSWORD = "123456";

        if (credentials?.email === "owner@edtech.com" && credentials?.password === VALID_PASSWORD) {
          return { id: "user_1", name: "Shubhangi", email: "owner@edtech.com", role: "OWNER" };
        }
        
        if (credentials?.email === "editor@edtech.com" && credentials?.password === VALID_PASSWORD) {
          return { id: "user_2", name: "Editor User", email: "editor@edtech.com", role: "EDITOR" };
        }
        
        if (credentials?.email === "viewer@edtech.com" && credentials?.password === VALID_PASSWORD) {
          return { id: "user_3", name: "Viewer User", email: "viewer@edtech.com", role: "VIEWER" };
        }

        return null; 
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
};