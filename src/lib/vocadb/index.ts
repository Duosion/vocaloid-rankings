import { Artist, ArtistThumbnailType, ArtistThumbnails, ArtistType, Id, NameType, Names, SongType, SourceType } from "@/data/types";
import { getImageMostVibrantColor } from "../material/material";
import { Hct, MaterialDynamicColors, SchemeVibrant, argbFromHex, argbFromRgb, hexFromArgb, themeFromSourceColor } from "@material/material-color-utilities";
import { VocaDBArtist } from "./types";

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
    'Remix': SongType.REMIX
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