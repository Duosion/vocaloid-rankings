const fetch = require("node-fetch")
const { getAverageColorAsync } = require("./shared")
const { argbFromHex, themeFromSourceColor, hexFromArgb } = require("@importantimport/material-color-utilities");
const database = require("../db")
const { parseHTML } = require("linkedom")
// import database classes
const SongViews = require("../db/dataClasses/SongViews")
const ArtistThumbnail = require("../db/dataClasses/ArtistThumbnail")
const Song = require("../db/dataClasses/song")
// import database enums
const Artist = require("../db/dataClasses/Artist")
const ArtistType = require("../db/enums/ArtistType")
const ViewType = require("../db/enums/ViewType")
const NameType = require("../db/enums/NameType")
const SongType = require("../db/enums/SongType")
const ArtistCategory = require("../db/enums/ArtistCategory")
const ArtistThumbnailType = require("../db/enums/ArtistThumbnailType");
const VideoViews = require("../db/dataClasses/VideoViews");

// strings
const scrapeDomains = {
    Vocaloid: {
        Domain: "https://vocaloid.fandom.com",
        ListURLs: [
            // youtube
            "/wiki/Category:Songs_with_10M_YouTube_views",
            "/wiki/Category:Songs_approaching_10M_YouTube_views",
            "/wiki/Category:Songs_with_100M_YouTube_views",

            // niconico
            "/wiki/Category:Hall_of_Myths",
            "/wiki/Category:Songs_approaching_10M_Niconico_views",

            // bilibili
            "/wiki/Category:Songs_with_1M_bilibili_views",
            "/wiki/Category:Songs_with_10M_bilibili_views"
        ]
    },
    CeVIO: {
        Domain: "https://cevio-lyrics.fandom.com",
        ListURLs: [
            // youtube
            "/wiki/Category:Songs_with_1M_YouTube_views",
            "/wiki/Category:Songs_with_10M_YouTube_views"
        ]
    }
}

const nicoNicoVideoDomain = "https://www.nicovideo.jp/watch/"

// tables
const allowedArtistTypes = {
    ["CeVIO"]: true,
    ["Vocaloid"]: true,
    ["OtherVoiceSynthesizer"]: true,
    ["SynthesizerV"]: true,
}

const blacklistedSongTypes = {
    ["Instrumental"]: true,
    ["MusicPV"]: true
}

const vocaDBLanguageMap = {
    ["Japanese"]: "Japanese",
    ["Romaji"]: "Romaji",
    ["English"]: "English"
}

const vocaDBArtistThumbnailMap = {
    ['urlOriginal']: ArtistThumbnailType.Original,
    ['urlThumb']: ArtistThumbnailType.Medium,
    ['urlSmallThumb']: ArtistThumbnailType.Small,
    ['urlTinyThumb']: ArtistThumbnailType.Tiny
}
const vocaDBThumbnailPriority = [ViewType.YouTube, ViewType.bilibili, ViewType.Niconico]

// numbers
const msInDay = 24 * 60 * 60 * 1000 // one day in ms

// vocaDB api strings
const vocaDBApiUrl = "https://vocadb.net/api/";
// entries api
const vocaDBRecentSongsApiUrl = "https://vocadb.net/api/songs?sort=AdditionDate&onlyWithPVs=true&status=Finished&fields=Names,PVs,Artists"
const vocaDBRecentSongsViewsThreshold = 10000 // how many views a recent song must have to be entered into this database
const vocaDBRecentSongsUploadDateThreshold = msInDay * 3 // (in ms) the maximum age in days of a song to be entered into this database
const vocaDBRecentSongsSearchDateThreshold = msInDay * 1 // (in ms) how many days back the getRecentSongs function searches.
const vocaDBDefaultMaxResults = 10
// song api
const vocaDBSongApiUrl = vocaDBApiUrl + "songs/"
const vocaDBSongApiParams = "?fields=Artists,Names,PVs&lang=Default"
// artists api
const vocaDBArtistsApiUrl = vocaDBApiUrl + "artists/"
const vocaDBArtistsApiParams = "?fields=Names,MainPicture"

//bilibili API
const bilibiliVideoDataEndpoint = "https://api.bilibili.com/x/web-interface/view?aid="
const bilibiliAidRegExp = /av(.+)/

// reg expressions
const vocaDbIDMatches = [
    /https:\/\/vocadb\.net\/S\/(\d+)/,
]

// streaming platform view pollers
const getBilibiliDataAsync = async (videoID) => {
    const aidMatches = videoID.match(bilibiliAidRegExp)
    const trimmedAid = aidMatches ? aidMatches[1] : videoID
    const serverResponse = await fetch(bilibiliVideoDataEndpoint + trimmedAid).catch(error => { return null })
    const responseBody = serverResponse ? await serverResponse.json() : null
    if (!responseBody || responseBody.code != 0) { return { Views: 0, Thumbnail: null }; }

    const responseData = responseBody.data
    const thumbnail = responseData.pic
    return {
        views: Number(responseData.stat.view),
        default: thumbnail,
        maxRes: thumbnail
    }
}

const getYoutubeViewsAsync = async (videoID) => {
    const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoID}&key=${process.env.YoutubeAPIKey}`)

    const responseBody = await response.json()

    const items = responseBody["items"]

    const firstItem = items != undefined ? responseBody["items"][0] : null

    return firstItem ? Number(firstItem["statistics"]["viewCount"]) : 0
}

const getYouTubeThumbnailsAsync = async (videoID) => {
    const defaultThumb = `https://img.youtube.com/vi/${videoID}/hqdefault.jpg`
    const maxResThumb = `https://img.youtube.com/vi/${videoID}/maxresdefault.jpg`

    const fetchResult = await fetch(maxResThumb)
        .then(res => {
            return res.status
        })
        .catch(_ => {
            return 404
        })

    return {
        default: defaultThumb,
        maxRes: fetchResult == 404 ? defaultThumb : maxResThumb
    }
}

const getNiconicoDataAsync = async (videoID) => {
    const serverResponse = await fetch(nicoNicoVideoDomain + videoID).catch(error => { return null })
    if (!serverResponse) { return { Views: 0, Thumbnail: null }; }
    const responseText = await serverResponse.text()

    const parsedHTML = parseHTML(responseText)
    // parse data-api-data
    const dataElement = parsedHTML.document.getElementById("js-initial-watch-data")
    if (!dataElement) { return { Views: 0, Thumbnail: null }; }

    const videoData = JSON.parse(dataElement.getAttribute("data-api-data")).video

    const thumbnail = videoData.thumbnail.url

    return {
        views: Number(videoData.count.view),
        default: thumbnail,
        maxRes: thumbnail
    }
}

const viewTypePollers = [
    getYoutubeViewsAsync,
    async (videoId) => {
        return (await getNiconicoDataAsync(videoId)).views
    },
    async (videoId) => {
        return (await getBilibiliDataAsync(videoId)).views
    }
]

const vocaDBPVPolls = {
    ["Youtube"]: {
        dataName: "YouTube",
        type: ViewType.YouTube,
        getViews: getYoutubeViewsAsync,
        getThumbnails: getYouTubeThumbnailsAsync,
        getBoth: async (videoId) => {
            return {
                views: await getYoutubeViewsAsync(videoId),
                ...(await getYouTubeThumbnailsAsync(videoId))
            }
        }
    },
    ["NicoNicoDouga"]: {
        dataName: "Niconico",
        type: ViewType.Niconico,
        getViews: viewTypePollers[ViewType.Niconico.id],
        getThumbnails: getNiconicoDataAsync,
        getBoth: getNiconicoDataAsync
    },
    ["Bilibili"]: {
        dataName: "bilibili",
        type: ViewType.bilibili,
        idPrefix: "av",
        getViews: viewTypePollers[ViewType.bilibili.id],
        getThumbnails: getBilibiliDataAsync,
        getBoth: getBilibiliDataAsync
    }
}

const vocaDbSongNameTypeMap = {
    ['Japanese']: NameType.Japanese,
    ['English']: NameType.English,
    ['Romaji']: NameType.Romaji
}

/**
 * Gets a song's views
 * 
 * @param {Array.<string>[]} videoIds The video ids to retrieve the views of.
 * @param {string} [timestamp] The timestamp of the views.
 * @returns {Promise<SongViews>}
 */

const getVideoIdsViewsAsync = (
    videoIds,
    timestamp
) => {
    return new Promise(async (resolve, reject) => {
        try {
            var totalViews = 0;

            const breakdown = []

            for (let [viewType, IDs] of videoIds.entries()) {
                const poller = viewTypePollers[viewType]

                if (poller && IDs) {
                    const bucket = []
                    breakdown[viewType] = bucket

                    for (let [_, videoID] of IDs.entries()) {
                        const views = (await poller(videoID)) || 0
                        if (views == 0) {
                            console.log(`0 views for video id ${videoID}`)
                        }
                        bucket.push(new VideoViews(
                            videoID,
                            views
                        ))
                        totalViews += views
                    }
                }
            }

            // resolve with the view count
            resolve(new SongViews(
                null,
                timestamp,
                totalViews,
                breakdown
            ))
        } catch (error) {
            reject(error)
        }
    })
}

/**
 * Gets a song's views
 * 
 * @param {Song} song The song to retrieve the views of.
 * @param {string} [timestamp] The timestamp of the views.
 * @returns {SongViews}
 */
const getSongViewsAsync = (
    song,
    timestamp
) => {
    return new Promise(async (resolve, reject) => {
        try {
            const songViews = await getVideoIdsViewsAsync(song.videoIds, timestamp)
            songViews.songId = song.id
            resolve(songViews)
        } catch (error) {
            reject(error)
        }
    })
}

const getFandomSongURLs = async () => {

    const urlMatches = {}

    for (let [songType, domainData] of Object.entries(scrapeDomains)) {

        const matches = []

        for (let [_, ListURL] of domainData.ListURLs.entries()) {

            const response = await fetch(domainData.Domain + ListURL)

            const responseText = await response.text()

            const parsedHTML = parseHTML(responseText)

            const document = parsedHTML.document;

            const externalURLs = document.querySelectorAll(".category-page__member-link")

            for (let [_, element] of externalURLs.entries()) {
                matches.push(decodeURIComponent(element.href))
            }

        }

        urlMatches[songType] = matches

    }

    return urlMatches

}

const getVocaDBRecentSongs = (maxResults = vocaDBDefaultMaxResults, offset = 0) => {
    // gets the most recent song entries from vocaDB
    return new Promise(async (resolve, reject) => {
        try {
            resolve(
                fetch(`${vocaDBRecentSongsApiUrl}&start=${offset}&maxResults=${maxResults}`)
                    .then(response => response.json())
                    .then(json => { return json['items'] })
                    .catch(error => { reject(error) }))
        } catch (error) {
            reject(error)
        }
    })
}

const getVocaDbID = (input) => {
    // attempts to get an ID from the provided input
    for (let [_, regExp] of vocaDbIDMatches.entries()) {
        const match = input.match(regExp)
        if (match) { return match[1] }
    }

    return null;
}

/**
 * Converts vocadb artist data into an Artist object.
 * 
 * @param {Object} artistData 
 * @returns {Promise<Artist>}
 */
const processVocaDBArtistDataAsync = (artistData) => {
    return new Promise(async (resolve, reject) => {
        try {

            // process names
            const names = [
                artistData.name
            ]
            artistData.names.forEach(nameData => {
                const nameType = NameType.map[nameData.language]
                const id = nameType && nameType.id
                const exists = id && names[id] ? true : false
                if (nameType && !exists) {
                    names[id] = nameData.value
                }
            })

            // process thumbnails
            const thumbnails = []
            let averageColor = null

            for (const [rawType, value] of Object.entries(artistData.mainPicture || {})) {
                const type = vocaDBArtistThumbnailMap[rawType]
                if (type) {

                    if (!averageColor) {
                        // do this so we only have to calculate the average color of an artist's thumbnail once
                        // (there are usually 4 thumbnails per artist, all the same, just downscaled from the original)
                        averageColor = (await getAverageColorAsync(value)).hex
                    }

                    thumbnails[type.id] = new ArtistThumbnail(
                        type,
                        value
                    )
                }
            }

            averageColor = averageColor || "#ffffff"

            const theme = themeFromSourceColor(argbFromHex(averageColor))
            const colorSchemes = theme.schemes

            const artistIdNumber = Number(artistData.id)

            resolve(new Artist(
                artistIdNumber,
                ArtistType.map[artistData.artistType],
                null,
                artistData.releaseDate || artistData.createDate,
                new Date().toISOString(),
                names,
                thumbnails,
                await database.songsData.getBaseArtist(artistIdNumber, names[NameType.Original.id]),
                averageColor,
                hexFromArgb(colorSchemes.dark.props.primary),
                hexFromArgb(colorSchemes.light.props.primary),
            ))
        } catch (error) {
            reject(error)
        }
    })
}

/**
 * Converts VocaDB api song data into video ids.
 * 
 * @param {Object} songData The song data from the VocaDB API
 * @returns {Array.<string>[]} A promise that resolves with the Song object derived from songData.
 */
const getVocaDBSongVideoIds = (songData) => {
    const videoIds = []

    for (const [_, pv] of songData.pvs.entries()) {
        const poller = vocaDBPVPolls[pv.service]
        if (pv.pvType == "Original" && !pv.disabled && poller) {
            const prefix = poller.idPrefix
            const pvID = prefix ? prefix + pv.pvId : pv.pvId // the video id of the pv

            /** @type {ViewType} */
            const pvType = poller.type
            const pvTypeId = pvType.id

            // add id to to video ids array
            var idBucket = videoIds[pvTypeId]
            if (!idBucket) {
                idBucket = []
                videoIds[pvTypeId] = idBucket
            }
            idBucket.push(pvID)
        }
    }
    return videoIds
}

/**
 * Converts VocaDB api song data into a song object.
 * 
 * @param {Object} songData The song data from the VocaDB API
 * @returns {Promise<Song>} A promise that resolves with the Song object derived from songData.
 */
const processVocaDBSongDataAsync = (songData) => {
    return new Promise(async (resolve, reject) => {
        try {
            const songType = songData.songType
            // check if the song type is blacklisted
            if (blacklistedSongTypes[songType]) {
                reject("Blacklisted song type.");
                return;
            }

            // variables
            const songDataProxy = database.songsData
            const songId = Number(songData.id)

            // check if this song is a cover
            // if it is one, return the original version instead
            {
                // attempt to get the original version

                const originalVersionID = songData.originalVersionId
                if (originalVersionID && songType == "Cover") {
                    resolve(scrapeVocaDBSongAsync(`https://vocadb.net/S/${originalVersionID}`))
                    return
                }

            }

            // get artists
            /** @type {Artist[]} */
            const artists = []

            for (let [_, artist] of songData.artists.entries()) {

                const artistCategories = artist.categories.split(",")

                for (let [_, category] of artistCategories.entries()) {
                    category = category.trim(); // trim whitespace
                    const categoryType = ArtistCategory.map[category]
                    if (categoryType) {
                        const artistData = artist.artist

                        const artistId = artistData && Number(artistData.id)
                        if (artistId) {
                            const artistObject = await songDataProxy.getArtist(artistId) || await scrapeVocaDBArtistAsync(artistId)
                            artistObject.category = categoryType
                            artists.push(artistObject)
                        }
                    }
                }
            }

            // get names
            const names = []
            names[NameType.Original.id] = songData.name // add original name
            for (const [_, name] of songData.names.entries()) {
                const type = vocaDbSongNameTypeMap[name.language]
                const id = type && type.id
                if (id && !names[id]) {
                    names[id] = name.value
                }
            }

            // get thumbnails, views and video ids
            const videoIds = []
            var thumbnail = null
            var maxResThumbnail = null

            const viewsBreakdown = []
            var totalViews = 0

            {
                const videosThumbnails = []

                for (const [_, pv] of songData.pvs.entries()) {
                    const poller = vocaDBPVPolls[pv.service]
                    if (pv.pvType == "Original" && !pv.disabled && poller) {
                        const prefix = poller.idPrefix
                        const pvID = prefix ? prefix + pv.pvId : pv.pvId // the video id of the pv

                        /** @type {ViewType} */
                        const pvType = poller.type
                        const pvTypeId = pvType.id

                        // add id to to video ids array
                        var idBucket = videoIds[pvTypeId]
                        if (!idBucket) {
                            idBucket = []
                            videoIds[pvTypeId] = idBucket
                        }
                        idBucket.push(pvID)

                        const viewsAndThumbnails = await poller.getBoth(pvID)

                        // add to total views
                        const views = viewsAndThumbnails.views
                        var breakdownBucket = viewsBreakdown[pvTypeId]
                        if (!breakdownBucket) {
                            breakdownBucket = {}
                            viewsBreakdown[pvTypeId] = breakdownBucket
                        }
                        breakdownBucket[pvID] = views
                        totalViews += views

                        // add to thumbnails
                        const exists = videosThumbnails[pvTypeId]
                        if (exists && (views > exists.views) || !exists) {
                            videosThumbnails[pvTypeId] = viewsAndThumbnails
                        }
                    }
                }

                // get the most relevant thumbnail
                for (const [_, viewType] of vocaDBThumbnailPriority.entries()) {
                    const thumbnails = videosThumbnails[viewType.id]
                    if (thumbnails) {
                        thumbnail = thumbnails.default
                        maxResThumbnail = thumbnails.maxRes
                        break;
                    }
                }
            }

            // process average color
            const averageColor = (await getAverageColorAsync(maxResThumbnail)).hex || "#ffffff"

            // process dark and light colors
            // Get the theme from a hex color
            const theme = themeFromSourceColor(argbFromHex(averageColor));

            // get individial light and dark colors
            const schemes = theme.schemes
            const lightColor = hexFromArgb(schemes.light.props.primary)
            const darkColor = hexFromArgb(schemes.dark.props.primary)

            resolve(new Song(
                songId,

                songData.publishDate,
                new Date().toISOString(),

                SongType.map[songType] || SongType.Other,

                thumbnail,
                maxResThumbnail,
                averageColor,
                darkColor,
                lightColor,
                null,

                artists,
                names,
                videoIds,

                new SongViews(
                    songId,
                    null,
                    totalViews,
                    viewsBreakdown
                ),
                null
            ))

        } catch (error) {
            reject(error)
        }
    })
}

/**
 * Generates a Song object based on VocaDB API data.
 * 
 * @param {string | number} vocaDbURL The vocaDB song ID or URL 
 * @returns {Promise<Song>} A promise that resolves with the derived song.
 */
const scrapeVocaDBSongAsync = (vocaDbURL) => {
    return new Promise(async (resolve, reject) => {
        // get the vocaDB ID
        const id = typeof (vocaDbURL) == "number" ? vocaDbURL : getVocaDbID(vocaDbURL)
        if (!id) { reject("Invalid URL provided.") }

        // fetch the data from the vocaDB API
        const serverResponse = await fetch(`${vocaDBSongApiUrl}${id}${vocaDBSongApiParams}`)
            .then(response => response.json())
            .catch(error => { reject(error); return })
        if (!serverResponse) { reject("No server response."); return; }

        resolve(processVocaDBSongDataAsync(serverResponse))
    })
}

/**
 * Generates an Artist obejct based on VocaDB API data.
 * 
 * @param {string | number} artistId The ID of the artist.
 * @returns {Promise<Artist>} A promise that resolves with the derived artist.
 */
const scrapeVocaDBArtistAsync = (artistId) => {
    return new Promise(async (resolve, reject) => {
        try {
            // fetch the data from the vocaDB API
            const serverResponse = await fetch(`${vocaDBArtistsApiUrl}${artistId}${vocaDBArtistsApiParams}`)
                .then(response => response.json())
                .catch(error => { reject(error); return })
            if (!serverResponse) { reject("No server response."); return; }

            resolve(processVocaDBArtistDataAsync(serverResponse))
        } catch (error) {
            reject(error)
        }
    })
}

/**
* Generates an Artist obejct based on VocaDB API data.
* 
* @param {string} artistName The name of the artist.
* @returns {Promise<Artist>} A promise that resolves with the derived artist.
*/
const scrapeVocaDBArtistFromNameAsync = (artistName) => {
    return new Promise(async (resolve, reject) => {
        try {
            // fetch the data from the vocaDB API
            const serverResponse = await fetch(`${vocaDBArtistsApiUrl}?query=${artistName}`)
                .then(response => response.json())
                .catch(error => { reject(error); return })
            if (!serverResponse) { reject("No server response."); return; }

            const firstItem = serverResponse.items[0]

            resolve(scrapeVocaDBArtistAsync(firstItem.id))
        } catch (error) {
            reject(error)
        }
    })
}

/**
 * Scrapes the most recent songs off of VocaDB that meet certain conditions.
 * Specifically, songs that have been uploaded within the past three days and have more than 10,000 views.
 * 
 * @returns {Song[]} The most recent songs.
 */
const scrapeVocaDBRecentSongsAsync = () => {
    return new Promise(async (resolve, reject) => {
        try {

            console.log("Getting recent songs...")

            var timeNow = null;
            var yearNow = null;
            var monthNow = null;
            var dayNow = null;
            var maxAgeDate = null;

            const recentSongs = [] // songs to return

            var continueFetching = true
            var offset = 0;
            while (continueFetching) {
                continueFetching = false
                console.log("offset [" + offset + "]")

                const apiResponse = await getVocaDBRecentSongs(vocaDBDefaultMaxResults, offset)

                for (const [_, entryData] of apiResponse.entries()) {

                    if (timeNow == null) {
                        timeNow = new Date(entryData.createDate)
                        maxAgeDate = new Date()
                        maxAgeDate.setTime(timeNow.getTime() - vocaDBRecentSongsSearchDateThreshold)
                        yearNow = timeNow.getFullYear()
                        monthNow = timeNow.getMonth()
                        dayNow = timeNow.getDate()
                    }

                    if (entryData.songType != "Cover") {
                        const ids = getVocaDBSongVideoIds(entryData)
                        const views = await getVideoIdsViewsAsync(ids)

                        if (views != null) {

                            if ((views.total >= vocaDBRecentSongsViewsThreshold) && (vocaDBRecentSongsUploadDateThreshold > (timeNow - new Date(entryData.publishDate)))) {
                                console.log(`${entryData.id} meets views threshold (${views.total} views)`)
                                recentSongs.push(await scrapeVocaDBSongAsync(entryData.id))
                            }
                        }

                    }
                }

                // repeat until the entry's date is no longer today
                const createDate = new Date(apiResponse[apiResponse.length - 1]["createDate"])
                continueFetching = createDate >= maxAgeDate

                offset += vocaDBDefaultMaxResults
            }

            console.log("Finished getting recent songs.")

            resolve(recentSongs)
        } catch (error) {
            reject(error)
        }
    })
}

const getFandomSongData = (songURL, songType) => { // v3

    return new Promise(async (resolve, reject) => {

        const songsData = []

        if (songType) {

            const domainData = scrapeDomains[songType]

            const serverResponse = await fetch(domainData.Domain + songURL).catch(error => { reject(error); return; })

            const responseText = await serverResponse.text()

            const parsedHTML = await parseHTML(responseText)

            const document = parsedHTML.document;

            const externalURLs = document.querySelectorAll(".external.text")

            var newURL;

            for (let [_, element] of externalURLs.entries()) {

                const href = element.href

                if (href.match(vocaDbIDMatches[0])) {

                    const songData = await scrapeVocaDBSongAsync(href).catch(err => reject(err))

                    if (songData) {
                        songsData.push(songData)
                    }
                }

            }

        } else {
            // get song data from vocaDB
            const songData = await scrapeVocaDBSongAsync(songURL).catch(err => reject(err))

            if (songData) {
                songsData.push(songData)
            }
        }

        resolve(songsData)

    })

}

const getFandomSongsData = (timestamp, excludeURLs, excludeIDs) => {
    return new Promise(async (resolve, reject) => {
        let songURLs = await getFandomSongURLs()

        excludeURLs = excludeURLs || {} // make sure it's not null
        excludeIDs = excludeIDs || {}

        const returnData = []

        for (let [songType, URLs] of Object.entries(songURLs)) {
            for (let [n, URL] of URLs.entries()) {

                if (!excludeURLs[URL]) {

                    excludeURLs[URL] = true // make the URL excluded

                    const songsData = await getFandomSongData(URL, songType).catch(err => { console.log(`URL ${URL} failed to parse. Error: ${err}`) })

                    if (songsData) {

                        for (let [_, song] of songsData.entries()) {
                            // add fandom URL
                            song.fandomUrl = URL


                            console.log(`[${songType}]`, n + 1, "out of", URLs.length)

                            if (song.views.total > 0) {
                                returnData.push(song)
                            }

                            excludeIDs[song.id] = true
                        }

                    }

                }

            }
        }

        resolve(returnData)
    })
}

// exports
exports.scrapeDomains = scrapeDomains
exports.getSongViewsAsync = getSongViewsAsync
// scrapers exports
exports.scrapeVocaDBSongAsync = scrapeVocaDBSongAsync
exports.scrapeVocaDBArtistAsync = scrapeVocaDBArtistAsync
exports.scrapeVocaDBArtistFromNameAsync = scrapeVocaDBArtistFromNameAsync
exports.scrapeVocaDBRecentSongsAsync = scrapeVocaDBRecentSongsAsync
// fandom exports
exports.getFandomSongURLs = getFandomSongURLs
exports.getFandomSongData = getFandomSongData
exports.getFandomSongsData = getFandomSongsData