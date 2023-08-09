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
    //placement: SongPlacement
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
        //placement: SongPlacement,
        thumbnailType: SourceType,
        views: Views | null,
        fandomUrl?: string
    ) {
        super(id, publishDate, additionDate, averageColor, darkColor, lightColor, names, views)
        this.type = type
        this.thumbnail = thumbnail
        this.maxresThumbnail = maxresThumbnail
        this.artists = artists
        this.videoIds = videoIds
        this.thumbnailType = thumbnailType
        this.fandomUrl = fandomUrl
    }
}

export type ArtistThumbnails = {
    [key in ArtistThumbnailType]: string
}

export class Artist extends Entity {
    type: ArtistType
    thumbnails: ArtistThumbnails
    //placement: ArtistPlacement
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
        //placement: ArtistPlacement,
        views: Views | null,
        baseArtist: Artist | null,
        category?: ArtistCategory
    ) {
        super(id, publishDate, additionDate, averageColor, darkColor, lightColor, names, views)
        this.type = type
        this.thumbnails = thumbnails
        this.baseArtist = baseArtist
        this.category = category
    }
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