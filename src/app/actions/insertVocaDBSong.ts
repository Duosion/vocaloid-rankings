'use server'

import { insertSong, songExists } from "@/data/songsData"
import { getVocaDBSong, parseVocaDBSongId } from "@/lib/vocadb"
import { LanguageDictionaryKey } from "@/localization"

export interface InsertVocaDBSongActionResponse {
    error?: LanguageDictionaryKey | string,
    songId?: string
}

export async function insertVocaDBSong(
    formData: FormData
): Promise<InsertVocaDBSongActionResponse> {
    try {
        const songUrl = formData.get('songUrl')
        const songId = songUrl ? parseVocaDBSongId(songUrl as string) : null
        if (!songId) throw new Error('add_song_invalid_url')

        if (await songExists(songId)) throw new Error('add_song_already_exists')
        await insertSong(await getVocaDBSong(songId))

        return {
            songId: songId.toString()
        }
        
    } catch (error: any) {
        if (error instanceof Error) {
            return {
                error: error.message as LanguageDictionaryKey
            }
        } else {
            return {
                error: String(error)
            }
        }
    }
}