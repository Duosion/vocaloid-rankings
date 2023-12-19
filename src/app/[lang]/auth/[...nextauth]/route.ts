import NextAuth from "next-auth/next";
import GoogleProvider from "next-auth/providers/google"
import { SqliteAdapter } from "./sqlite-adapter";
import { AuthOptions } from "next-auth";

const handler = NextAuth({
    providers: [
        GoogleProvider({ clientId: process.env.GOOGLE_CLIENT_ID || '', clientSecret: process.env.GOOGLE_CLIENT_SECRET || '' })
    ],
    adapter: SqliteAdapter()
})

export { handler as GET, handler as POST }