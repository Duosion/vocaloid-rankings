'use server'

import { insertList } from "@/data/songsData"
import { Id, UserAccessLevel } from "@/data/types"
import { getAuthenticatedUser } from "@/lib/auth"
import { LanguageDictionaryKey } from "@/localization"
import { cookies } from "next/headers"
import { ListValues } from "../[lang]/list/list-editor"

export interface InsertListActionResponse {
    error?: LanguageDictionaryKey | string,
    listId?: Id
}

export async function insertListAction(
    listValues: ListValues
): Promise<InsertListActionResponse> {
    try {
        
        const user = await getAuthenticatedUser(cookies())

        if (!user || UserAccessLevel.EDITOR > user.accessLevel) throw new Error('Unauthorized')

        const newList = await insertList({
            created: new Date(),
            lastUpdated: new Date(),
            songIds: listValues.songIds,
            names: listValues.names,
            descriptions: listValues.descriptions,
            image: listValues.image
        })

        return {
            listId: newList.id
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