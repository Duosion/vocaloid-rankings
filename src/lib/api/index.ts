import { NameType, Names, PlacementChange, SongType, SourceType } from "@/data/types";
import { ApiNames } from "./types";
import { ApolloClient, InMemoryCache, gql } from "@apollo/client";

const apiEndpoint = '/api/v1'

// general-purpose functions
export const graphClient = new ApolloClient({
    uri: apiEndpoint,
    cache: new InMemoryCache()
})

// queries
export const GET_SONG_RANKINGS = gql`
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
    ) {
        totalCount
        timestamp
        results {
            placement
            views
            song {
                id
                thumbnail
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

export const GET_ARTIST_RANKINGS = gql`
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
    ) {
        totalCount
        timestamp
        results {
            placement
            views
            artist {
                id
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