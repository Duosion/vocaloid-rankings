import { APIError, GraphQLResponseError } from "graphql-hooks";

export function RankingsApiError(
    {
        error
    }: {
        error?: APIError<GraphQLResponseError>
    }
) {
    const graphQLErrors = error?.graphQLErrors

    const errorMessage: string | undefined = error?.fetchError?.message || (graphQLErrors && graphQLErrors[0]?.message) || error?.httpError?.body

    return (
        <h2 className="text-3xl font-bold text-center text-on-background">{errorMessage}</h2>
    )
}