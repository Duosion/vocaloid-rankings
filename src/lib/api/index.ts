import { ArtistType, NameType, Names, PlacementChange, SongType, SourceType } from "@/data/types";
import { GraphQLClient } from "graphql-hooks";
import MemCacheFunction from "graphql-hooks-memcache";
import { ApiNames } from "./types";
import { getCookie } from "cookies-next";

const apiEndpoint = '/api/v1'

// general-purpose functions
let sessionToken = getCookie('session')

const headers: { [key: string]: string } = { }

if (sessionToken) {
    headers['Authorization'] = `Bearer ${sessionToken.toString()}`
}

export const graphClient = new GraphQLClient({
    url: apiEndpoint,
    cache: MemCacheFunction(),
    headers: headers
})

sessionToken = undefined

// queries
export const GET_SONG_RANKINGS = `
query SongRankings(
    $timestamp: String
    $timePeriodOffset: Int
    $changeOffset: Int
    $daysOffset: Int
    $includeSourceTypes: [SourceType]
    $excludeSourceTypes: [SourceType]
    $includeSongTypes: [SongType]
    $excludeSongTypes: [SongType]
    $includeArtistTypes: [ArtistType]
    $excludeArtistTypes: [ArtistType]
    $includeArtistTypesMode: FilterInclusionMode
    $excludeArtistTypesMode: FilterInclusionMode
    $publishDate: String
    $orderBy: FilterOrder
    $direction: FilterDirection
    $includeArtists: [Int]
    $includeArtistsMode: FilterInclusionMode
    $excludeArtists: [Int]
    $excludeArtistsMode: FilterInclusionMode
    $includeSimilarArtists: Boolean
    $includeSongs: [Int]
    $excludeSongs: [Int]
    $singleVideo: Boolean
    $maxEntries: Int
    $startAt: Int
    $minViews: Long
    $maxViews: Long
    $search: String
    $list: Int
) {
    songRankings(
        timestamp: $timestamp
        timePeriodOffset: $timePeriodOffset
        changeOffset: $changeOffset
        daysOffset: $daysOffset
        includeSourceTypes: $includeSourceTypes
        excludeSourceTypes: $excludeSourceTypes
        includeSongTypes: $includeSongTypes
        excludeSongTypes: $excludeSongTypes
        includeArtistTypes: $includeArtistTypes
        excludeArtistTypes: $excludeArtistTypes
        includeArtistTypesMode: $includeArtistTypesMode
        excludeArtistTypesMode: $excludeArtistTypesMode
        publishDate: $publishDate
        orderBy: $orderBy
        direction: $direction
        includeArtists: $includeArtists
        includeArtistsMode: $includeArtistsMode
        excludeArtists: $excludeArtists
        excludeArtistsMode: $excludeArtistsMode
        includeSimilarArtists: $includeSimilarArtists
        includeSongs: $includeSongs
        excludeSongs: $excludeSongs
        singleVideo: $singleVideo
        maxEntries: $maxEntries
        startAt: $startAt
        minViews: $minViews
        maxViews: $maxViews
        search: $search
        list: $list
    ) {
        totalCount
        timestamp
        results {
            placement
            views
            song {
                id
                thumbnail
                publishDate
                additionDate
                darkColor
                lightColor
                artistsCategories {
                    vocalists
                    producers
                }
                artists {
                    id
                    names {
                        original
                        japanese
                        romaji
                        english
                    }
                    darkColor
                    lightColor
                }
                names {
                    original
                    japanese
                    romaji
                    english
                }
            }
        }
    }
}
`

export const GET_ARTIST_RANKINGS = `
query ArtistRankings(
    $timestamp: String
    $timePeriodOffset: Int
    $changeOffset: Int
    $daysOffset: Int
    $includeSourceTypes: [SourceType]
    $excludeSourceTypes: [SourceType]
    $includeSongTypes: [SongType]
    $excludeSongTypes: [SongType]
    $includeArtistTypes: [ArtistType]
    $excludeArtistTypes: [ArtistType]
    $artistCategory: ArtistCategory
    $songPublishDate: String
    $publishDate: String
    $orderBy: FilterOrder
    $direction: FilterDirection
    $includeArtists: [Int]
    $excludeArtists: [Int]
    $combineSimilarArtists: Boolean
    $includeSongs: [Int]
    $excludeSongs: [Int]
    $singleVideo: Boolean
    $maxEntries: Int
    $startAt: Int
    $minViews: Long
    $maxViews: Long
    $search: String
    $includeCoArtistsOf: [Int]
    $parentArtistId: Int
) {
    artistRankings(
        timestamp: $timestamp
        timePeriodOffset: $timePeriodOffset
        changeOffset: $changeOffset
        daysOffset: $daysOffset
        includeSourceTypes: $includeSourceTypes
        excludeSourceTypes: $excludeSourceTypes
        includeSongTypes: $includeSongTypes
        excludeSongTypes: $excludeSongTypes
        includeArtistTypes: $includeArtistTypes
        excludeArtistTypes: $excludeArtistTypes
        artistCategory: $artistCategory
        songPublishDate: $songPublishDate
        publishDate: $publishDate
        orderBy: $orderBy
        direction: $direction
        includeArtists: $includeArtists
        excludeArtists: $excludeArtists
        combineSimilarArtists: $combineSimilarArtists
        includeSongs: $includeSongs
        excludeSongs: $excludeSongs
        singleVideo: $singleVideo
        maxEntries: $maxEntries
        startAt: $startAt
        minViews: $minViews
        maxViews: $maxViews
        search: $search
        includeCoArtistsOf: $includeCoArtistsOf
        parentArtistId: $parentArtistId
    ) {
        totalCount
        timestamp
        results {
            placement
            views
            artist {
                id
                type
                publishDate
                additionDate
                names {
                    original
                    japanese
                    romaji
                    english
                }
                thumbnails {
                    original
                    medium
                    small
                    tiny
                }
                darkColor
                lightColor
            }
        }
    }
}
`

// enum mappers
export function mapPlacementChange(
    apiValue: string
): PlacementChange {
    switch (apiValue) {
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
    switch (apiValue) {
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
    switch (apiValue) {
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

// enum ArtistType { VOCALOID, CEVIO, SYNTHESIZER_V, ILLUSTRATOR, COVER_ARTIST, ANIMATOR, PRODUCER, OTHER_VOCALIST, OTHER_VOICE_SYNTHESIZER, OTHER_INDIVIDUAL, OTHER_GROUP, UTAU, PROJECT_SEKAI }
export function mapArtistType(
    apiValue: string
): ArtistType {
    switch (apiValue) {
        case 'VOCALOID': return ArtistType.VOCALOID;
        case 'CEVIO': return ArtistType.CEVIO;
        case 'SYNTHESIZER_V': return ArtistType.SYNTHESIZER_V;
        case 'ILLUSTRATOR': return ArtistType.ILLUSTRATOR;
        case 'COVER_ARTIST': return ArtistType.COVER_ARTIST;
        case 'ANIMATOR': return ArtistType.ANIMATOR;
        case 'PRODUCER': return ArtistType.PRODUCER;
        case 'OTHER_VOCALIST': return ArtistType.OTHER_VOCALIST;
        case 'OTHER_VOICE_SYNTHESIZER': return ArtistType.OTHER_VOICE_SYNTHESIZER;
        case 'OTHER_INDIVIDUAL': return ArtistType.OTHER_INDIVIDUAL;
        case 'OTHER_GROUP': return ArtistType.OTHER_GROUP;
        case 'UTAU': return ArtistType.UTAU;
        case 'PROJECT_SEKAI': return ArtistType.PROJECT_SEKAI;
        default: return ArtistType.VOCALOID
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
