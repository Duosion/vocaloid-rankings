
import { graphql } from "graphql"
import { Schema } from "./schema"
import { NextResponse } from "next/server"

export async function POST(
    request: Request
) {
    const { query, variables }: {query: string, variables: {[key: string]: unknown}} = await request.json()

    const response = await graphql({
        schema: Schema,
        source: query,
        variableValues: variables
    })

    return NextResponse.json(response)
}