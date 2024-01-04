'use client'

import { InsertVocaDBSongActionResponse, insertVocaDBSong } from "@/app/actions/insertVocaDBSong"
import { FilledButton } from "@/components/material/filled-button"
import { useLocale } from "@/components/providers/language-dictionary-provider"
import { LanguageDictionaryKey } from "@/localization"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function AddSongForm() {
    const langDict = useLocale()
    const router = useRouter()

    const [error, setError] = useState(null as string | null)
    const [loading, setLoading] = useState(false)

    return (
        <form
            action={async (formData: FormData) => {
                if (loading) return
                setLoading(true)
                const result: InsertVocaDBSongActionResponse = await insertVocaDBSong(formData)
                
                
                const error = result.error
                setError(error ? langDict[error as LanguageDictionaryKey] || error : null)
                setLoading(false)

                const id = result.songId
                if (id) router.push(`./${id}`)
                
            }}
            className="flex flex-col gap-3 w-full"
        >
            <input
                disabled={loading}
                aria-disabled={loading}
                name='songUrl'
                type='url'
                placeholder='https://vocadb.net/S/414140'
                pattern='https://vocadb.net/S/.*'
                className="w-full py-2 px-4 rounded-full text-on-surface flex text-base font-normal bg-surface-container-low"
                required
            />

            {error ? <h4 className="pl-4 text-base text-error">{error}</h4> : undefined}

            <FilledButton
                disabled={loading}
                className="w-full mt-2"
                text={langDict.add_song_submit}
            />
        </form>
    )
}