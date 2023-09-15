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

export interface Timestamp {
    formatted: string,
    original: Date
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

export abstract class Entity {
    id: Id
    publishDate: string
    additionDate: string
    averageColor: string
    darkColor: string
    lightColor: string
    names: Names
    views: Views | null

    constructor(
        id: Id,
        publishDate: string,
        additionDate: string,
        averageColor: string,
        darkColor: string,
        lightColor: string,
        names: Names,
        views: Views | null
    ) {
        this.id = id
        this.publishDate = publishDate
        this.additionDate = additionDate
        this.averageColor = averageColor
        this.darkColor = darkColor
        this.lightColor = lightColor
        this.names = names
        this.views = views
    }
}

export class Song extends Entity {
    type: SongType
    thumbnail: string
    maxresThumbnail: string
    artists: Artist[]
    videoIds: SongVideoIds
    placement: SongPlacement | null
    thumbnailType: SourceType
    fandomUrl?: string

    constructor(
        id: Id,
        publishDate: string,
        additionDate: string,
        type: SongType,
        thumbnail: string,
        maxresThumbnail: string,
        averageColor: string,
        darkColor: string,
        lightColor: string,
        artists: Artist[],
        names: Names,
        videoIds: SongVideoIds,
        thumbnailType: SourceType,
        views: Views | null,
        placement: SongPlacement | null,
        fandomUrl?: string
    ) {
        super(id, publishDate, additionDate, averageColor, darkColor, lightColor, names, views)
        this.type = type
        this.thumbnail = thumbnail
        this.maxresThumbnail = maxresThumbnail
        this.artists = artists
        this.videoIds = videoIds
        this.thumbnailType = thumbnailType
        this.placement = placement
        this.fandomUrl = fandomUrl
    }
}

export type ArtistThumbnails = {
    [key in ArtistThumbnailType]: string
}

export class Artist extends Entity {
    type: ArtistType
    thumbnails: ArtistThumbnails
    placement: ArtistPlacement | null
    baseArtist: Artist | null
    category?: ArtistCategory

    constructor(
        id: Id,
        type: ArtistType,
        publishDate: string,
        additionDate: string,
        names: Names,
        thumbnails: ArtistThumbnails,
        averageColor: string,
        darkColor: string,
        lightColor: string,
        placement: ArtistPlacement | null,
        views: Views | null,
        baseArtist: Artist | null,
        category?: ArtistCategory
    ) {
        super(id, publishDate, additionDate, averageColor, darkColor, lightColor, names, views)
        this.type = type
        this.thumbnails = thumbnails
        this.placement = placement
        this.baseArtist = baseArtist
        this.category = category
    }
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
    publishDate?: string
    orderBy: FilterOrder = FilterOrder.VIEWS
    direction: FilterDirection = FilterDirection.DESCENDING
    artists?: Id[]
    songs?: Id[]
    singleVideo: boolean = false
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
        includeSourceTypes?: SourceType[],
        excludeSourceTypes?: SourceType[],
        includeSongTypes?: SongType[],
        excludeSongTypes?: SongType[],
        includeArtistTypes?: ArtistType[],
        excludeArtistTypes?: ArtistType[],
        publishDate?: string,
        orderBy?: FilterOrder,
        direction?: FilterDirection,
        artists?: Id[],
        songs?: Id[],
        singleVideo?: boolean,
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
        this.includeSourceTypes = includeSourceTypes
        this.excludeSourceTypes = excludeSourceTypes
        this.includeSongTypes = includeSongTypes
        this.excludeSongTypes = excludeSongTypes
        this.includeArtistTypes = includeArtistTypes
        this.excludeArtistTypes = excludeArtistTypes
        this.publishDate = publishDate
        this.orderBy = orderBy || this.orderBy
        this.direction = direction || this.direction
        this.artists = artists
        this.songs = songs
        this.singleVideo = singleVideo || this.singleVideo
        this.maxEntries = maxEntries || this.maxEntries
        this.startAt = startAt || this.startAt
        this.minViews = minViews
        this.maxViews = maxViews
        this.search = search
    }
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
    filterArtists: string
    filterSongs: string
    filterIncludeSourceTypes?: string
    filterExcludeSourceTypes?: string
    filterIncludeSongTypes?: string
    filterExcludeSongTypes?: string
    filterIncludeArtistTypes?: string
    filterExcludeArtistTypes?: string
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