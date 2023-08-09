import { error, time } from "console";
import getDatabase, { generateTimestamp } from "./database";
import { Databases } from "./database";
import { Artist, ArtistCategory, ArtistThumbnailType, ArtistThumbnails, ArtistType, HistoricalViews, HistoricalViewsResult, Id, NameType, Names, RawArtistData, RawArtistName, RawArtistThumbnail, RawSongArtist, RawSongData, RawSongName, RawSongVideoId, RawViewBreakdown, Song, SongType, SongVideoIds, SourceType, Views, ViewsBreakdown } from "./types";
import type { Statement } from "better-sqlite3";

// import database
const db = getDatabase(Databases.SONGS_DATA)

// Views
function getMostRecentViewsTimestampSync(): string | null {
    const result = db.prepare(`
    SELECT timestamp
    FROM views_metadata
    ORDER BY timestamp DESC
    LIMIT 1`).get() as { timestamp: string }
    return result ? result.timestamp : null
}

function buildEntityViews(
    viewsBreakdowns: RawViewBreakdown[],
    timestamp?: string
): Views {
    // process breakdown
    var totalViews = 0
    const breakdown: ViewsBreakdown = {}
    viewsBreakdowns.forEach(breakdownData => {
        const type = breakdownData.view_type as SourceType
        let bucket = breakdown[type]
        if (!bucket) {
            bucket = []
            breakdown[type] = bucket
        }
        // add breakdown to bucket
        const views = breakdownData.views as number

        bucket.push({
            id: breakdownData.video_id,
            views: views
        })
        // increment total
        totalViews += views
    })

    return {
        total: totalViews,
        breakdown: breakdown,
        timestamp: timestamp
    }
}

// Historical
function getHistoricalViewsSync(
    statement: Statement,
    params: Object,
    range: number = 7,
    period: number = 1,
    timestamp: string | null = getMostRecentViewsTimestampSync()
): HistoricalViewsResult {
    if (!timestamp) { return {
        range: range,
        period: period,
        startAt: timestamp,
        largest: 0,
        views: []
    }}
    const views: (number | bigint)[] = []
    const timestamps: string[] = []
    const historicalViews: HistoricalViews[] = []
    for (let i = 0; i < range + 1; i++) {
        const daysOffset = i * period
        const dbResult = statement.get({
            ...params,
            daysOffset: daysOffset,
            timestamp: timestamp
        }) as HistoricalViews
        views.push(dbResult.views)
        const dbResultTimestamp = dbResult.timestamp
        if (dbResultTimestamp) {
            timestamps.push(dbResultTimestamp)
        } else {
            const timestampDate = new Date(timestamp)
            timestampDate.setDate(timestampDate.getDate() - daysOffset)
            timestamps.push(generateTimestamp(timestampDate)?.formatted || dbResultTimestamp)
        }

    }
    let largest = 0
    for (let i = 0; i < views.length - 1; i++) {
        const current = views[i]
        const next = views[i + 1]
        const total = (current as number) - (next as number)
        largest = Math.max(total, largest)
        historicalViews.push({
            views: total,
            timestamp: timestamps[i]
        })
    }
    return {
        range: range,
        period: period,
        startAt: timestamp,
        largest: largest,
        views: historicalViews
    }
}

// Artists
function buildArtist(
    artistData: RawArtistData,
    artistNames: RawArtistName[],
    artistThumbnails: RawArtistThumbnail[],
    views: Views | null,
    //placement?: ArtistPlacement
): Artist {
    // process names
    const names: Names = {
        [NameType.ORIGINAL]: ''
    }
    artistNames.forEach(nameData => {
        names[nameData.name_type as NameType] = nameData.name
    })

    // process thumbnails
    const thumbnails = {
        [ArtistThumbnailType.ORIGINAL]: '',
        [ArtistThumbnailType.MEDIUM]: '',
        [ArtistThumbnailType.SMALL]: '',
        [ArtistThumbnailType.TINY]: ''
    }
    artistThumbnails.forEach(thumbnailData => {
        const thumbType = thumbnailData.thumbnail_type as ArtistThumbnailType
        thumbnails[thumbType] = thumbnailData.url
    })
    const type = artistData.artist_type as ArtistType

    const baseArtistId = artistData.base_artist_id

    return new Artist(
        artistData.id,
        type,
        artistData.publish_date,
        artistData.addition_date,
        names,
        thumbnails,
        artistData.average_color,
        artistData.dark_color,
        artistData.light_color,
        views,
        baseArtistId ? getArtistSync(baseArtistId) : null,
        //placement
    )
}

function getArtistViewsSync(
    id: Id,
    timestamp: string | null = getMostRecentViewsTimestampSync()
): Views | null {
    if (!timestamp) {
        return buildEntityViews([])
    }

    const viewsBreakdown = db.prepare(`
    SELECT views_breakdowns.view_type, SUM(views_breakdowns.views) AS views, 0 AS video_id
    FROM views_breakdowns
    INNER JOIN songs_artists ON songs_artists.artist_id = :id
    WHERE (views_breakdowns.timestamp = :timestamp)
        AND (views_breakdowns.song_id = songs_artists.song_id)
    GROUP BY views_breakdowns.view_type`).all({
        id: id,
        timestamp: timestamp
    }) as RawViewBreakdown[]

    return buildEntityViews(
        viewsBreakdown,
        timestamp
    )
}

function getArtistSync(
    id: Id,
    getViews: boolean = true
): Artist | null {
    const artistData = db.prepare(`
    SELECT id, artist_type, publish_date, addition_date, base_artist_id, average_color, dark_color, light_color
    FROM artists
    WHERE id = ?`).get(id) as RawArtistData

    // return null if the artist doesn't exist.
    if (artistData == undefined) { return null }

    const artistNames = db.prepare(`
    SELECT name, name_type
    FROM artists_names
    WHERE artist_id = ?`).all(id) as RawArtistName[]

    const artistThumbnails = db.prepare(`
    SELECT thumbnail_type, url
    FROM artists_thumbnails
    WHERE artist_id = ?`).all(id) as RawArtistThumbnail[]

    const views = getViews ? getArtistViewsSync(id) : null
    //const placement = views ? this.#getArtistPlacementSync(artistData, views) : null

    return buildArtist(
        artistData,
        artistNames,
        artistThumbnails,
        views,
        //placement
    )
}

export function getArtistHistoricalViews(
    id: Id,
    range = 7,
    period = 1,
    timestamp = getMostRecentViewsTimestampSync()
): Promise<HistoricalViewsResult> {
    return new Promise<HistoricalViewsResult>((resolve, reject) => {
        try {
            resolve(getHistoricalViewsSync(
                db.prepare(`
                SELECT SUM(views) AS views, 
                    MIN(timestamp) AS timestamp
                FROM views_breakdowns
                INNER JOIN songs_artists ON songs_artists.song_id = views_breakdowns.song_id
                WHERE (songs_artists.artist_id = :id)
                AND (timestamp = DATE(:timestamp, '-' || :daysOffset || ' day'))`),
                {
                    id: id
                },
                range,
                period,
                timestamp
            ))
        } catch (error) {
            reject(error)
        }
    })
}

// Song
function buildSong(
    songData: RawSongData,
    songNames: RawSongName[],
    songArtists: Artist[],
    songVideoIds: RawSongVideoId[],
    songViews: Views | null,
    //songPlacement: SongPlacement
): Song {
    const songId = songData.id
    // process names
    const names: Names = {
        [NameType.ORIGINAL]: ''
    }
    songNames.forEach(nameData => {
        names[nameData.name_type as NameType] = nameData.name
    })

    // process video ids
    const videoIds: SongVideoIds = {}
    songVideoIds.forEach(videoIdData => {
        const type = videoIdData.video_type as SourceType
        // get bucket
        let bucket = videoIds[type]
        if (!bucket) {
            bucket = []
            videoIds[type] = bucket
        }
        // add video id to bucket
        bucket.push(videoIdData.video_id)
    })

    const thumbType = songData.thumbnail_type as SourceType
    const thumb = songData.thumbnail
    const maxresThumb = songData.maxres_thumbnail

    // build song
    return new Song(
        songId,
        songData.publish_date,
        songData.addition_date,
        songData.song_type as SongType,
        thumb,
        maxresThumb,
        songData.average_color,
        songData.dark_color,
        songData.light_color,
        songArtists,
        names,
        videoIds,
        //placement: songPlacement,
        thumbType,
        songViews,
        songData.fandom_url
    )
}

function getSongViewsSync(
    songId: Id,
    timestamp: string | null = getMostRecentViewsTimestampSync()
): Views | null {
    if (!timestamp) {
        return buildEntityViews([])
    }

    const breakdowns = db.prepare(`
    SELECT views, video_id, view_type
    FROM views_breakdowns
    WHERE song_id = ? AND timestamp = ?
    ORDER BY views DESC`).all(songId, timestamp) as RawViewBreakdown[]

    return buildEntityViews(
        breakdowns,
        timestamp
    )
}

function getSongSync(
    songId: Id,
    getViews: boolean = true
): Song | null {

    const songData = db.prepare(`
        SELECT id, publish_date, addition_date, song_type, thumbnail, maxres_thumbnail, thumbnail_type, average_color, dark_color, light_color, fandom_url
        FROM songs
        WHERE id = ?`).get(songId) as RawSongData

    // resolve with null if the song was not found
    if (songData == undefined) { return null }

    // get names
    const songNames = db.prepare(`
    SELECT name, name_type 
    FROM songs_names
    WHERE song_id = ?`).all(songId) as RawSongName[]

    // get song artists
    const songArtists = db.prepare(`
    SELECT artist_id, artist_category
    FROM songs_artists
    WHERE song_id = ?`).all(songId) as RawSongArtist[]

    // get video ids
    const songVideoIds = db.prepare(`
    SELECT video_id, video_type
    FROM songs_video_ids
    WHERE song_id = ?`).all(songId) as RawSongVideoId[]


    // get artists data
    const artists: Artist[] = []
    songArtists.forEach(rawArtist => {
        const artist = getArtistSync(rawArtist.artist_id, false)
        if (artist) {
            artist.category = rawArtist.artist_category as ArtistCategory
            artists.push(artist)
        }
    })
    const songViews = getViews ? getSongViewsSync(songId) : null
    //const songPlacement = songViews ? this.#getSongPlacementSync(songData, songViews) : null


    return buildSong(
        songData,
        songNames,
        artists,
        songVideoIds,
        songViews,
        //songPlacement
    )
}

export function getSong(
    id: Id
): Promise<Song | null> {
    return new Promise<Song | null>((resolve, reject) => {
        try {
            resolve(getSongSync(id))
        } catch (error) {
            reject(error)
        }
    })
}

export function getAllSongIds(): Promise<{ id: Id }[]> {
    return new Promise<{ id: Id }[]>((resolve, reject) => {
        try {
            resolve(db.prepare(`
            SELECT id
            FROM songs`).all() as { id: Id }[])
        } catch (error) {
            reject(error)
        }
    })
}

export function getSongHistoricalViews(
    id: Id,
    range = 7,
    period = 1,
    timestamp = getMostRecentViewsTimestampSync()
): Promise<HistoricalViewsResult> {
    return new Promise<HistoricalViewsResult>((resolve, reject) => {
        try {
            resolve(getHistoricalViewsSync(
                db.prepare(`
                SELECT SUM(views) AS views, MIN(timestamp) AS timestamp
                FROM views_breakdowns
                WHERE (song_id = :id)
                    AND (timestamp = DATE(:timestamp, '-' || :daysOffset || ' day'))`),
                {
                    id: id
                },
                range,
                period,
                timestamp
            ))
        } catch (error) {
            reject(error)
        }
    })
}