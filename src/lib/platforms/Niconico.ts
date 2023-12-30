import { Platform, VideoId, VideoThumbnails } from "./types";
import { defaultFetchHeaders } from ".";

const nicoNicoAPIDomain = "https://nvapi.nicovideo.jp/v1/"
const headers = {
    ...defaultFetchHeaders,
    'x-Frontend-Id': '6',
    'x-Frontend-version': '0'
}

class NiconicoPlatform implements Platform {

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
        .catch(_ => { return null })
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
        .catch(_ => { return null })
    }

}

const Niconico = new NiconicoPlatform()
export default Niconico