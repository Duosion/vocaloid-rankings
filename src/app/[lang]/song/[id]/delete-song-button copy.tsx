'use client'
import { FilledButton } from "@/components/material/filled-button"
import { APIError, GraphQLResponseError, useManualQuery } from "graphql-hooks"
import { useRouter } from "next/navigation"

const DELETE_SONG_QUERY = `
mutation deleteSong(
    $id: Int!
) {
    deleteSong(id: $id)
}
`

export function DeleteSongButton(
    {
        text,
        songId
    }: {
        text: string,
        songId: number
    }
) {
    const router = useRouter()

    const [refreshSong, { loading, error }] = useManualQuery(DELETE_SONG_QUERY, {
        variables: { id: songId },
    })

    const handleRefresh = () => refreshSong()
        .then(_ => {
            router.back()
        })
        .catch(error => { })

    
    const graphQLErrors = (error as APIError<GraphQLResponseError>)?.graphQLErrors
    return (
        <>
            <FilledButton
                text={text}
                icon='delete'
                onClick={handleRefresh}
                disabled={loading}
            />
            {error ? <h4 className="text-lg text-error">{ error?.fetchError?.message || (graphQLErrors && graphQLErrors[0]?.message) || error?.httpError?.body}</h4> : undefined}
        </>
    )
}