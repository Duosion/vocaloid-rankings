import { parseHTML } from "linkedom";
import { Platform, VideoId, VideoThumbnails } from "./types";

const nicoNicoVideoDomain = "https://www.nicovideo.jp/watch/"

class NiconicoPlatform implements Platform {

    async getViews(
        videoId: VideoId
    ): Promise<number | null> {
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

    getThumbnails(
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

}

const Niconico = new NiconicoPlatform()
export default Niconico