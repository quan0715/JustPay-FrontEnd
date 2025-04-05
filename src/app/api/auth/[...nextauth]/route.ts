import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { SiweMessage } from "siwe";
import { getUserData, createUserData } from "@/app/_actions/userDataAction";
declare module "next-auth" {
  interface Session {
    address?: string;
  }
}

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Ethereum",
      credentials: {
        message: {
          label: "Message",
          type: "text",
        },
        signature: {
          label: "Signature",
          type: "text",
        },
      },
      async authorize(credentials) {
        if (!credentials?.message || !credentials?.signature) return null;
        try {
          const nextAuthUrl = new URL(
            process.env.NEXTAUTH_URL ?? "http://localhost:3000"
          );
          const siweMessage = new SiweMessage(credentials.message);
          // console.log(siweMessage);
          const result = await siweMessage.verify({
            signature: credentials.signature,
            domain: nextAuthUrl.host,
          });
          if (result.success) {
            const address = siweMessage.address;
            const userData = await getUserData(address);
            if (userData) {
              return {
                id: siweMessage.address,
                address: siweMessage.address,
              };
            } else {
              await createUserData(address);
              return {
                id: siweMessage.address,
                address: siweMessage.address,
              };
            }
          }
          return null;
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 60 * 60, // 1 小時
  },
  jwt: {
    maxAge: 60 * 60, // 1 小時
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.address = token.sub;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
