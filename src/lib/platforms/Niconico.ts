import { parseHTML } from "linkedom";
import { Platform, VideoId, VideoThumbnails } from "./types";

const nicoNicoVideoDomain = "https://www.nicovideo.jp/watch/"

class NiconicoPlatform implements Platform {

    getViews(
        videoId: VideoId
    ): Promise<number | null> {
        return fetch(nicoNicoVideoDomain + videoId)
            .then(response => response.text())
            .then(text => {
                const parsedHTML = parseHTML(text)
                // parse data-api-data
                const dataElement = parsedHTML.document.getElementById("js-initial-watch-data")
                if (!dataElement) { return null }

                const videoData = JSON.parse(dataElement.getAttribute("data-api-data") || '[]')?.video

                const rawViews = videoData?.count?.view
                return rawViews == undefined ? null : Number.parseInt(rawViews)
            })
            .catch(_ => { return null })
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