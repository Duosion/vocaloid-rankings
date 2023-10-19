export enum NameType {
    ORIGINAL,
    JAPANESE,
    ENGLISH,
    ROMAJI
}

export enum SongType {
    ORIGINAL,
    REMIX,
    OTHER
}

export enum SourceType {
    YOUTUBE,
    NICONICO,
    BILIBILI
}

export enum ArtistCategory {
    VOCALIST,
    PRODUCER
}

export enum ArtistThumbnailType {
    ORIGINAL,
    MEDIUM,
    SMALL,
    TINY
}

export enum ArtistType {
    VOCALOID,
    CEVIO,
    SYNTHESIZER_V,
    ILLUSTRATOR,
    COVER_ARTIST,
    ANIMATOR,
    PRODUCER,
    OTHER_VOCALIST,
    OTHER_VOICE_SYNTHESIZER,
    OTHER_INDIVIDUAL,
    OTHER_GROUP,
    UTAU
}

export enum PlacementChange {
    UP,
    SAME,
    DOWN
}

export enum FilterOrder {
    VIEWS,
    PUBLISH_DATE,
    ADDITION_DATE,
    POPULARITY
}

export enum FilterDirection {
    DESCENDING,
    ASCENDING
}

export enum FilterInclusionMode {
    AND,
    OR
}

export type Names = {
    [NameType.ORIGINAL]: string
    [NameType.JAPANESE]?: string
    [NameType.ENGLISH]?: string
    [NameType.ROMAJI]?: string
}

export type SongVideoIds = {
    [key in SourceType]?: string[]
}

export type ViewsBreakdown = {
    [key in SourceType]?: VideoViews[]
}

export type Id = number | bigint

export type ArtistThumbnails = {
    [key in ArtistThumbnailType]: string
}

export type SongArtistsCategories = { [key in ArtistCategory]: Id[] }

export interface HistoricalViews {
    views: number | bigint
    timestamp: string
}

export interface HistoricalViewsResult {
    range: number
    period: number
    startAt: string | null
    largest: number | bigint
    views: HistoricalViews[]
}

export interface VideoViews {
    id: string
    views: number | bigint
}

export interface Views {
    total: number | bigint
    breakdown: ViewsBreakdown
    timestamp?: string
}

export interface SongPlacement {
    allTime: number,
    releaseYear: number
}

export interface ArtistPlacement {
    allTime: number
}

export interface Entity {
    id: Id,
    publishDate: string
    additionDate: string
    averageColor: string
    darkColor: string
    lightColor: string
    names: Names
    views: Views | null
}

export interface Song extends Entity {
    type: SongType
    thumbnail: string
    maxresThumbnail: string
    artistsCategories: SongArtistsCategories
    artists: Artist[]
    videoIds: SongVideoIds
    placement: SongPlacement | null
    thumbnailType: SourceType
    lastUpdated: string
    isDormant: boolean
    fandomUrl?: string
}

export interface Artist extends Entity {
    type: ArtistType
    thumbnails: ArtistThumbnails
    placement: ArtistPlacement | null
    baseArtist: Artist | null
    baseArtistId?: Id | null
}
export class SongRankingsFilterParams {
    timestamp?: string
    timePeriodOffset?: number
    changeOffset?: number
    daysOffset?: number
    includeSourceTypes?: SourceType[]
    excludeSourceTypes?: SourceType[]
    includeSongTypes?: SongType[]
    excludeSongTypes?: SongType[]
    includeArtistTypes?: ArtistType[]
    excludeArtistTypes?: ArtistType[]
    includeArtistTypesMode: FilterInclusionMode = FilterInclusionMode.AND
    excludeArtistTypesMode: FilterInclusionMode = FilterInclusionMode.OR
    publishDate?: string
    orderBy: FilterOrder = FilterOrder.VIEWS
    direction: FilterDirection = FilterDirection.DESCENDING
    includeArtists?: Id[]
    excludeArtists?: Id[]
    includeArtistsMode: FilterInclusionMode = FilterInclusionMode.AND
    excludeArtistsMode: FilterInclusionMode = FilterInclusionMode.OR
    includeSimilarArtists: boolean = false
    songs?: Id[]
    singleVideo: boolean = false
    maxEntries: number = 50
    startAt: number = 0
    minViews?: number
    maxViews?: number
    search?: string
}

export class ArtistRankingsFilterParams {
    timestamp?: string
    timePeriodOffset?: number
    changeOffset?: number
    daysOffset?: number
    sourceType?: SourceType
    songType?: SongType
    artistType?: ArtistType
    artistCategory?: ArtistCategory
    publishDate?: string
    orderBy: FilterOrder = FilterOrder.VIEWS
    direction: FilterDirection = FilterDirection.DESCENDING
    artists?: Id[]
    songs?: Id[]
    singleVideo: boolean = false
    combineSimilarArtists: boolean = false
    maxEntries: number = 50
    startAt: number = 0
    minViews?: number
    maxViews?: number
    search?: string

    constructor(
        timestamp?: string,
        timePeriodOffset?: number,
        changeOffset?: number,
        daysOffset?: number,
        sourceType?: SourceType,
        songType?: SongType,
        artistType?: ArtistType,
        artistCategory?: ArtistCategory,
        publishDate?: string,
        orderBy?: FilterOrder,
        direction?: FilterDirection,
        artists?: Id[],
        songs?: Id[],
        singleVideo?: boolean,
        combineSimilarArtists?: boolean,
        maxEntries?: number,
        startAt?: number,
        minViews?: number,
        maxViews?: number,
        search?: string
    ) {
        this.timestamp = timestamp
        this.timePeriodOffset = timePeriodOffset || this.timePeriodOffset
        this.changeOffset = changeOffset || this.changeOffset
        this.daysOffset = daysOffset || this.daysOffset
        this.sourceType = sourceType
        this.songType = songType
        this.artistType = artistType
        this.artistCategory = artistCategory
        this.publishDate = publishDate
        this.orderBy = orderBy || this.orderBy
        this.direction = direction || this.direction
        this.artists = artists
        this.songs = songs
        this.singleVideo = singleVideo || this.singleVideo
        this.combineSimilarArtists = combineSimilarArtists || this.combineSimilarArtists
        this.maxEntries = maxEntries || this.maxEntries
        this.startAt = startAt || this.startAt
        this.minViews = minViews
        this.maxViews = maxViews
        this.search = search
    }
}

export interface SongRankingsFilterResult {
    totalCount: number
    timestamp: string
    results: SongRankingsFilterResultItem[]
}

export interface SongRankingsFilterResultItem {
    placement: number
    change?: PlacementChange
    previousPlacement?: number
    views: number
    song: Song
}

export interface ArtistRankingsFilterResult {
    totalCount: number
    timestamp: string
    results: ArtistRankingsFilterResultItem[]
}

export interface ArtistRankingsFilterResultItem {
    placement: number
    change?: PlacementChange
    previousPlacement?: number
    views: number
    artist: Artist
}

export interface SqlRankingsFilterParams {
    filterIncludeArtists?: string[]
    filterExcludeArtists?: string[]
    filterSongs?: string[]
    filterIncludeSourceTypes?: string[]
    filterExcludeSourceTypes?: string[]
    filterIncludeSongTypes?: string[]
    filterExcludeSongTypes?: string[]
    filterIncludeArtistTypes?: string[]
    filterExcludeArtistTypes?: string[]
    params: { [key: string]: any }
}

export interface SqlSearchArtistsFilterParams {
    excludeArtists: string,
    params: { [key: string]: any }
}

export interface RawSongData {
    id: Id
    publish_date: string
    addition_date: string
    song_type: number
    thumbnail: string
    maxres_thumbnail: string
    thumbnail_type: number
    average_color: string
    dark_color: string
    light_color: string
    last_updated: string
    dormant: number
    fandom_url?: string
}

export interface RawSongName {
    name: string
    name_type: number
}

export interface RawSongArtist {
    artist_id: Id
    artist_category: number
}

export interface RawSongVideoId {
    video_id: string
    video_type: number
}

export interface RawArtistData {
    id: Id
    artist_type: number
    publish_date: string
    addition_date: string
    base_artist_id?: Id
    average_color: string
    dark_color: string
    light_color: string
}

export interface RawArtistName {
    name: string
    name_type: number
}

export interface RawArtistThumbnail {
    thumbnail_type: number
    url: string
}

export interface RawViewBreakdown {
    views: number | bigint
    video_id: string
    view_type: number
}

export interface RawSongRankingsResult {
    song_id: Id,
    total_views: number
}

export interface RawArtistRankingResult {
    artist_id: Id,
    total_views: number
}