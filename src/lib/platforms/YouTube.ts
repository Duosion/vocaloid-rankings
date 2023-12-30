import { defaultFetchHeaders } from ".";
import { Platform, VideoId, VideoThumbnails } from "./types";

class YouTubePlatform implements Platform {

    getViews(
        videoId: VideoId
    ): Promise<number | null> {
        return fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${process.env.YOUTUBE_API_KEY}`, { headers: defaultFetchHeaders })
            .then(response => response.json())
            .then(body => {
                const items = body['items']
                const firstItem = items != undefined ? items[0] : null
                return firstItem ? Number.parseInt(firstItem['statistics']['viewCount']) : null
            })
            .catch(_ => { return null })
    }

    getThumbnails(
        videoId: VideoId
    ): Promise<VideoThumbnails> {
        const defaultThumb = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
        const maxResThumb = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`

        return fetch(maxResThumb, { headers: defaultFetchHeaders })
            .then(res => {
                return {
                    default: defaultThumb,
                    quality: res.status == 404 ? defaultThumb : maxResThumb
                }
            })
            .catch(_ => {
                return {
                    default: defaultThumb,
                    quality: defaultThumb
                }
            })
    }

}

const YouTube = new YouTubePlatform()
export default YouTube