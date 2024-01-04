
import { graphql } from "graphql"
import { Schema } from "./schema"
import { NextResponse } from "next/server"
import { GraphQLContext } from "./types"
import { getSession, getUser } from "@/data/auth"

export async function POST(
    request: Request
) {
    const { query, variables }: {query: string, variables: {[key: string]: unknown}} = await request.json()

    const authorization = request.headers.get('authorization')
    const token = authorization ? authorization.split('Bearer')[1] : null
    const session = token ? await getSession(token.trim()) : null

    const response = await graphql({
        schema: Schema,
        source: query,
        variableValues: variables,
        contextValue: {
            user: session ? await getUser(session.userId) : null
        } as GraphQLContext
    })

    return NextResponse.json(response)
}