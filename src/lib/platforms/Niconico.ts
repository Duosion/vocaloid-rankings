import { Platform, VideoId, VideoThumbnails } from "./types";
import { defaultFetchHeaders } from ".";
import { parseHTML } from "linkedom";

const nicoNicoVideoDomain = "https://www.nicovideo.jp/watch/"

const nicoNicoAPIDomain = "https://nvapi.nicovideo.jp/v1/"
const headers = {
    ...defaultFetchHeaders,
    'x-Frontend-Id': '6',
    'x-Frontend-version': '0'
}

class NiconicoPlatform implements Platform {

    // fallback to 
    async getViewsFallback(
        videoId: VideoId
    ): Promise<number | null> {
        console.log('niconico views fallback')
        const result = await fetch(nicoNicoVideoDomain + videoId, {
            method: 'GET',
        })
        if (!result) return null

        const text = await result.text()

        const parsedHTML = parseHTML(text)
        // parse data-api-data
        const dataElement = parsedHTML.document.getElementById("js-initial-watch-data")
        if (!dataElement) { return null }

        const videoData = JSON.parse(dataElement.getAttribute("data-api-data") || '[]')?.video

        const rawViews = videoData?.count?.view
        return rawViews == undefined ? null : Number.parseInt(rawViews)
    }

    getThumbnailsFallback(
        videoId: VideoId
    ): Promise<VideoThumbnails | null> {
        return fetch(nicoNicoVideoDomain + videoId)
            .then(response => response.text())
            .then(text => {
                const parsedHTML = parseHTML(text)
                // parse data-api-data
                const dataElement = parsedHTML.document.getElementById("js-initial-watch-data")
                if (!dataElement) { return null }

                const videoData = JSON.parse(dataElement.getAttribute("data-api-data") || '[]')?.video

                const thumbnail = videoData?.thumbnail?.url
                return thumbnail == undefined ? null : {
                    default: thumbnail,
                    quality: thumbnail
                }
            })
            .catch(_ => { return null })
    }

    // https://niconicolibs.github.io/api/nvapi/#tag/Video
    async getViews(
        videoId: VideoId
    ): Promise<number | null> {
        return fetch(`${nicoNicoAPIDomain}videos?watchIds=${videoId}`, {
            headers: headers
        }).then(res => res.json())
        .then(videoData => {
            return videoData['data']['items'][0]['video']['count']['view']
        })
        .catch(_ => { return this.getViewsFallback(videoId) })
    }

    getThumbnails(
        videoId: VideoId
    ): Promise<VideoThumbnails | null> {
        return fetch(`${nicoNicoAPIDomain}videos?watchIds=${videoId}`, {
            headers: headers
        }).then(res => res.json())
        .then(videoData => {
            const thumbnails = videoData['data']['items'][0]['video']['thumbnail']
            const defaultThumbnail = thumbnails['listingUrl']
            return {
                default: defaultThumbnail,
                quality: thumbnails['largeUrl'] || defaultThumbnail
            }
        })
        .catch(_ => { return this.getThumbnailsFallback(videoId) })
    }

}

const Niconico = new NiconicoPlatform()
export default Niconico