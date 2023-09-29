import { NameType, Names, PlacementChange, SongType, SourceType } from "@/data/types";
import { ApiNames } from "./types";
import { ApolloClient, InMemoryCache } from "@apollo/client";

const apiEndpoint = '/api/v1'

// general-purpose functions
export const graphClient = new ApolloClient({
    uri: apiEndpoint,
    cache: new InMemoryCache()
})

// enum mappers
export function mapPlacementChange(
    apiValue: string
): PlacementChange {
    switch(apiValue) {
        case 'UP':
            return PlacementChange.UP
        case 'SAME':
            return PlacementChange.SAME
        case 'DOWN':
            return PlacementChange.DOWN
        default:
            return PlacementChange.SAME
    }
}

export function mapSongType(
    apiValue: string
): SongType {
    switch(apiValue) {
        case 'ORIGINAL':
            return SongType.ORIGINAL
        case 'REMIX':
            return SongType.REMIX
        case 'OTHER':
            return SongType.OTHER
        default:
            return SongType.OTHER
    }
}

export function mapSourceType(
    apiValue: string
): SourceType {
    switch(apiValue) {
        case 'YOUTUBE':
            return SourceType.YOUTUBE
        case 'NICONICO':
            return SourceType.NICONICO
        case 'BILIBILI':
            return SourceType.BILIBILI
        default:
            return SourceType.YOUTUBE
    }
}

// builders
export function buildEntityNames(
    apiData: ApiNames
): Names {
    return {
        [NameType.ORIGINAL]: apiData.original,
        [NameType.JAPANESE]: apiData.japanese,
        [NameType.ENGLISH]: apiData.english,
        [NameType.ROMAJI]: apiData.romaji
    }
}