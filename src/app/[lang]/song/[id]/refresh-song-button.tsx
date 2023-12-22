'use client'
import { Divider } from "@/components/material/divider"
import { FilledButton } from "@/components/material/filled-button"
import { APIError, GraphQLResponseError, useManualQuery } from "graphql-hooks"
import { useRouter } from "next/navigation"

const REFRESH_SONG_QUERY = `
mutation refreshSong(
    $id: Int!
) {
    refreshSongFromVocaDB(id: $id) { id }
}
`

export function RefreshSongButton(
    {
        text,
        songId
    }: {
        text: string,
        songId: number
    }
) {

    const router = useRouter()

    const [refreshSong, { loading, error }] = useManualQuery(REFRESH_SONG_QUERY, {
        variables: { id: songId }
    })

    const handleRefresh = () => refreshSong()
        .then(_ => {
            router.refresh()
        })
        .catch(error => { })

    
    const graphQLErrors = (error as APIError<GraphQLResponseError>)?.graphQLErrors
    return (
        <>
            <FilledButton
                text='Refresh Song Data'
                icon='refresh'
                onClick={handleRefresh}
                disabled={loading}
            />
            {error ? <h4 className="text-lg text-error">{ error?.fetchError?.message || (graphQLErrors && graphQLErrors[0]?.message) || error?.httpError?.body}</h4> : undefined}

        
            <Divider/>
        </>
    )
}