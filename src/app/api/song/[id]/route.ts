import { getSong } from "@/data/songsData"
import { GenerateApiResponse } from "../../ApiResponse"

export async function GET(
    request: Request, 
    context: {
        params: {
            id: string
        }
    }
) {
    const id = Number.parseInt(context.params.id)
    const song = id ? await getSong(id) : null
    
    const exists = song ? true : false

    return GenerateApiResponse(
        song || undefined,
        exists ? undefined : [
            {
                status: 404,
                title: 'song_not_found',
                message: `Song with id [${id}] not found or does not exist.`
            }
        ],
        exists ? 200 : 404
    )
}