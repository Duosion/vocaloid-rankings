/* graphql types */

import { ArtistPlacement, SongPlacement, VideoViews } from "@/data/types"

export interface ApiErrorLocation {
    line: number,
    column: number
}

export interface ApiError {
    message: string
    locations: ApiErrorLocation[]
}

export interface ApiResponse {
    errors?: ApiError[]
    data?: any
}

/* api types */
export interface ApiNames {
    original: string
    japanese?: string
    english?: string
    romaji?: string
}

export interface ApiViewsBreakdown {
    youtube?: VideoViews[]
    niconico?: VideoViews[]
    bilbili?: VideoViews[]
}

export interface ApiEntityViews {
    timestamp: string
    total: number
    breakdown: ApiViewsBreakdown
}

export interface ApiEntity {
    id: number
    publishDate: string
    additionDate: string
    averageColor: string
    darkColor: string
    lightColor: string
    names: ApiNames
    views: ApiEntityViews | null
}

/* api song */
export interface ApiSongVideoIds {
    youtube?: string[]
    niconico?: string[]
    bilibili?: string[]
}

export interface ApiSong extends ApiEntity {
    type: string
    thumbnail: string
    maxresThumbnail: string
    videoIds: ApiSongVideoIds
    artists: ApiArtist[]
    placement: SongPlacement | null
    thumbnailType: string
}

/* api artist */
export interface ApiArtistThumbnails {
    original: string
    medium: string
    small: string
    tiny: string
}

export interface ApiArtist extends ApiEntity {
    type: string
    thumbnails: ApiArtistThumbnails
    placement: ArtistPlacement | null
    baseArtist: ApiArtist | null
    category?: string
}

/* api rankings results */

export interface ApiSongRankingsFilterResultItem {
    placement: number
    change?: string
    previousPlacement?: number
    views: number
    song: ApiSong
}

export interface ApiSongRankingsFilterResult {
    totalCount: number
    timestamp: string
    results: ApiSongRankingsFilterResultItem[]
}