import { Artist, ArtistCategory, ArtistThumbnailType, ArtistThumbnails, ArtistType, Id, NameType, Names, Song, SongArtistsCategories, SongType, SongVideoIds, SourceType, ViewsBreakdown } from "@/data/types";
import { getImageMostVibrantColor } from "../material/material";
import { Hct, MaterialDynamicColors, SchemeVibrant, argbFromHex, argbFromRgb, hexFromArgb, themeFromSourceColor } from "@material/material-color-utilities";
import { VocaDBArtist, VocaDBSong, VocaDBSourcePoller } from "./types";
import { getArtist } from "@/data/songsData";
import YouTube from "../platforms/YouTube";
import Niconico from "../platforms/Niconico";
import bilibili from "../platforms/bilibili";

// import platforms
const youtubePlatform = new YouTube()
const niconicoPlatform = new Niconico()
const bilibiliPlatform = new bilibili()

// numbers
const msInDay = 24 * 60 * 60 * 1000 // one day in ms

// vocaDB api strings
const vocaDBApiUrl = "https://vocadb.net/api/";
// entries api
const vocaDBRecentSongsApiUrl = vocaDBApiUrl + "songs?sort=AdditionDate&onlyWithPVs=true&status=Finished&fields=Names,PVs,Artists"
const vocaDBRecentSongsViewsThreshold = 10000 // how many views a recent song must have to be entered into this database
const vocaDBRecentSongsUploadDateThreshold = msInDay * 3 // (in ms) the maximum age in days of a song to be entered into this database
const vocaDBRecentSongsSearchDateThreshold = msInDay * 1 // (in ms) how many days back the getRecentSongs function searches.
const vocaDBDefaultMaxResults = 10
// song api
const vocaDBSongApiUrl = vocaDBApiUrl + "songs/"
const vocaDBSongApiParams = "?fields=Artists,Names,PVs&lang=Default"
// artists api
const vocaDBArtistsApiUrl = vocaDBApiUrl + "artists/"
const vocaDBArtistsApiParams = "?fields=Names,MainPicture,BaseVoicebank"

// tables
const blacklistedSongTypes: { [key: string]: boolean } = {
    ["Instrumental"]: true,
    ["MusicPV"]: true
}

const artistCategoryMap: { [key: string]: ArtistCategory } = {
    'Producer': ArtistCategory.PRODUCER,
    'Vocalist': ArtistCategory.VOCALIST,
}

const vocaDBThumbnailPriority = [SourceType.YOUTUBE, SourceType.BILIBILI, SourceType.NICONICO]

const vocaDbSongNameTypeMap: { [key: string]: NameType } = {
    ['Japanese']: NameType.JAPANESE,
    ['English']: NameType.ENGLISH,
    ['Romaji']: NameType.ROMAJI
}

const artistTypeMap: { [key: string]: ArtistType } = {
    'Vocaloid': ArtistType.VOCALOID,
    'CeVIO': ArtistType.CEVIO,
    'SynthesizerV': ArtistType.SYNTHESIZER_V,
    'Illustrator': ArtistType.ILLUSTRATOR,
    'CoverArtist': ArtistType.COVER_ARTIST,
    'Animator': ArtistType.ANIMATOR,
    'Producer': ArtistType.PRODUCER,
    'OtherVocalist': ArtistType.OTHER_VOCALIST,
    'OtherVoiceSynthesizer': ArtistType.OTHER_VOICE_SYNTHESIZER,
    'OtherIndividual': ArtistType.OTHER_INDIVIDUAL,
    'OtherGroup': ArtistType.OTHER_GROUP,
    'UTAU': ArtistType.UTAU
}

const songTypeMap: { [key: string]: SongType } = {
    'Original': SongType.ORIGINAL,
    'Cover': SongType.COVER,
    'Remix': SongType.REMIX
}

const sourcePollers: { [key: string]: VocaDBSourcePoller } = {
    ["Youtube"]: {
        dataName: "YouTube",
        type: SourceType.YOUTUBE,
        getViews: youtubePlatform.getViews,
        getThumbnails: youtubePlatform.getThumbnails,
    },
    ["NicoNicoDouga"]: {
        dataName: "Niconico",
        type: SourceType.NICONICO,
        getViews: niconicoPlatform.getViews,
        getThumbnails: niconicoPlatform.getThumbnails,
    },
    ["Bilibili"]: {
        dataName: "bilibili",
        type: SourceType.BILIBILI,
        idPrefix: "av",
        getViews: bilibiliPlatform.getViews,
        getThumbnails: bilibiliPlatform.getThumbnails,
    }
}

const getRecentSongs = (
    maxResults: number = vocaDBDefaultMaxResults,
    offset: number = 0
): Promise<any> => {
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

const parseVocaDBArtistDataAsync = (
    artistData: VocaDBArtist
): Promise<Artist> => {
    return new Promise(async (resolve, reject) => {
        try {
            // process names
            const names: Names = [
                artistData.name
            ]
            artistData.names.forEach(name => {
                const nameType = vocaDbSongNameTypeMap[name.language]
                const exists = nameType && names[nameType] ? true : false
                if (nameType && !exists) {
                    names[nameType] = name.value
                }
            })

            // process thumbnails
            const mainPicture = artistData.mainPicture
            const normalThumbnail = mainPicture.urlThumb || mainPicture.urlOriginal

            const mostVibrantColor = await getImageMostVibrantColor(normalThumbnail)
            const mostVibrantColorArgb = argbFromRgb(mostVibrantColor[0], mostVibrantColor[1], mostVibrantColor[2])

            // get the base artist
            const baseArtist = artistData.baseVoicebank

            // resolve
            resolve({
                id: artistData.id,
                type: artistTypeMap[artistData.artistType],
                publishDate: artistData.releaseDate,
                additionDate: new Date().toISOString(),
                thumbnails: {
                    [ArtistThumbnailType.ORIGINAL]: mainPicture.urlOriginal,
                    [ArtistThumbnailType.MEDIUM]: normalThumbnail,
                    [ArtistThumbnailType.SMALL]: mainPicture.urlSmallThumb,
                    [ArtistThumbnailType.TINY]: mainPicture.urlTinyThumb
                } as ArtistThumbnails,
                baseArtistId: baseArtist?.id,
                averageColor: hexFromArgb(mostVibrantColorArgb),
                lightColor: hexFromArgb(MaterialDynamicColors.primary.getArgb(new SchemeVibrant(Hct.fromInt(mostVibrantColorArgb), false, 0.3))),
                darkColor: hexFromArgb(MaterialDynamicColors.primary.getArgb(new SchemeVibrant(Hct.fromInt(mostVibrantColorArgb), true, 0.3))),
                names: names,
                placement: null,
                views: null,
                baseArtist: null
            } as Artist)
        } catch (error) {
            reject(error)
        }
    })
}

const parseVocaDBSongAsync = (
    vocaDBSong: VocaDBSong
): Promise<Song> => {
    return new Promise(async (resolve, reject) => {
        try {
            const songType = vocaDBSong.songType
            // check if the song type is blacklisted
            if (blacklistedSongTypes[songType]) {
                reject("Blacklisted song type.");
                return;
            }

            // get artists
            const artists: Artist[] = []
            const artistsCategories: SongArtistsCategories = {
                [ArtistCategory.VOCALIST]: [],
                [ArtistCategory.PRODUCER]: []
            }

            let vocalSynths = 0
            for (const artist of vocaDBSong.artists) {
                const artistCategories = artist.categories.split(",")

                for (const category of artistCategories) {
                    const categoryType = artistCategoryMap[category.trim()]
                    if (categoryType != undefined) {
                        const artistData = artist.artist
                        const id = artistData.id
                        const artistObject = await getArtist(id) || await getVocaDBArtist(id)
                        artistsCategories[categoryType].push(id)
                        if (categoryType === ArtistCategory.VOCALIST && artistObject.type != ArtistType.OTHER_VOCALIST) {
                            vocalSynths++
                        }
                        artists.push(artistObject)
                    }
                }
            }

            if (0 >= vocalSynths) {
                return reject('All songs on this website must have at least one vocal synthesizer as a singer.')
            }

            // get names
            // process names
            const names: Names = [
                vocaDBSong.name
            ]
            vocaDBSong.names.forEach(name => {
                const nameType = vocaDbSongNameTypeMap[name.language]
                const exists = nameType && names[nameType] ? true : false
                if (nameType && !exists) {
                    names[nameType] = name.value
                }
            })

            // get thumbnails, views and video ids
            const videoIds: SongVideoIds = {}
            let thumbnail: string = ''
            let thumbnailType: SourceType = SourceType.YOUTUBE
            let maxResThumbnail: string = ''

            const viewsBreakdown: ViewsBreakdown = {}
            let totalViews = 0

            {
                const videosThumbnails: { 
                    [key in SourceType]?: {
                        views: number,
                        default: string,
                        quality: string,
                        type: SourceType
                    }
                } = {}
                for (const pv of vocaDBSong.pvs) {
                    const poller = sourcePollers[pv.service]
                    if (pv.pvType == "Original" && !pv.disabled && poller) {
                        const prefix = poller.idPrefix
                        const pvID = prefix ? prefix + pv.pvId : pv.pvId // the video id of the pv
                        const pvType = poller.type

                        // add id to to video ids array
                        let idBucket = videoIds[pvType]
                        if (!idBucket) {
                            idBucket = []
                            videoIds[pvType] = idBucket
                        }
                        idBucket.push(pvID)

                        const views = await poller.getViews(pvID)
                        const thumbnails = await poller.getThumbnails(pvID)
                        if (!views) { return reject(`No view data found for pv ${pvID}`) }
                        if (!thumbnails) { return reject(`No thumbnails for for pv ${pvID}`) }

                        // add to total views
                        let breakdownBucket = viewsBreakdown[pvType]
                        if (!breakdownBucket) {
                            breakdownBucket = []
                            viewsBreakdown[pvType] = breakdownBucket
                        }
                        breakdownBucket.push({
                            id: pvID,
                            views: views
                        })
                        totalViews += views

                        // add to thumbnails
                        const exists = videosThumbnails[pvType]
                        if (exists && (views > exists.views) || !exists) {
                            videosThumbnails[pvType] = {
                                views: views,
                                default: thumbnails.default,
                                quality: thumbnails.quality,
                                type: pvType
                            }
                        }
                    }
                }

                // get the most relevant thumbnail
                for ( const viewType of vocaDBThumbnailPriority ) {
                    const thumbnails = videosThumbnails[viewType]
                    if (thumbnails) {
                        thumbnail = thumbnails.default
                        maxResThumbnail = thumbnails.quality
                        thumbnailType = thumbnails.type
                        break;
                    }
                }
            }

            const mostVibrantColor = await getImageMostVibrantColor(thumbnail)
            const mostVibrantColorArgb = argbFromRgb(mostVibrantColor[0], mostVibrantColor[1], mostVibrantColor[2])

            const isoDate = new Date().toISOString()

            resolve({
                id: vocaDBSong.id,
                publishDate: vocaDBSong.publishDate,
                additionDate: isoDate,
                averageColor: hexFromArgb(mostVibrantColorArgb),
                lightColor: hexFromArgb(MaterialDynamicColors.primary.getArgb(new SchemeVibrant(Hct.fromInt(mostVibrantColorArgb), false, 0.3))),
                darkColor: hexFromArgb(MaterialDynamicColors.primary.getArgb(new SchemeVibrant(Hct.fromInt(mostVibrantColorArgb), true, 0.3))),
                names: names,
                views: {
                    total: totalViews,
                    breakdown: viewsBreakdown
                },
                type: songTypeMap[songType],
                thumbnail: thumbnail,
                maxresThumbnail: maxResThumbnail,
                artistsCategories: artistsCategories,
                artists: artists,
                videoIds: videoIds,
                thumbnailType: thumbnailType,
                lastUpdated: isoDate,
                isDormant: false,
            })

        } catch (error) {
            reject(error)
        }
    })
}

export const getVocaDBArtist = (
    artistId: Id
): Promise<Artist> => {
    return new Promise(async (resolve, reject) => {
        try {
            // fetch the data from the vocaDB API
            const serverResponse = await fetch(`${vocaDBArtistsApiUrl}${artistId}${vocaDBArtistsApiParams}`)
                .then(response => response.json())
                .catch(error => { reject(error); return })
            if (!serverResponse) { reject("No server response."); return; }

            resolve(parseVocaDBArtistDataAsync(serverResponse))
        } catch (error) {
            reject(error)
        }
    })
}

export const getVocaDBSong = (
    songId: Id
): Promise<Song> => {
    return new Promise(async (resolve, reject) => {
        try {
            // fetch the data from the vocaDB API
            const serverResponse = await fetch(`${vocaDBSongApiUrl}${songId}${vocaDBSongApiParams}`)
                .then(response => response.json())
                .catch(error => { reject(error); return })
            if (!serverResponse) { reject("No server response."); return; }

            resolve(parseVocaDBSongAsync(serverResponse))
        } catch (error) {
            reject(error)
        }
    })
}