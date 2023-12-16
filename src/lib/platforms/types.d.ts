export type VideoId = string

export interface VideoThumbnails {
    default: string
    quality: string
}

export interface Platform {

    getViews(videoId: VideoId): Promise<number | null>

    getThumbnails(videoId: VideoId): Promise<VideoThumbnails | null>

}