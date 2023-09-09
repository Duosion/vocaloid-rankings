import getDatabase, { generateTimestamp } from "./database";
import { Databases } from "./database";
import { Artist, ArtistCategory, ArtistThumbnailType, ArtistThumbnails, ArtistType, HistoricalViews, HistoricalViewsResult, Id, NameType, Names, PlacementChange, RankingsFilterParams, RankingsFilterResult, RankingsFilterResultItem, RawArtistData, RawArtistName, RawArtistThumbnail, RawRankingsResult, RawSongArtist, RawSongData, RawSongName, RawSongVideoId, RawViewBreakdown, Song, SongType, SongVideoIds, SourceType, SqlRankingsFilterParams, Views, ViewsBreakdown } from "./types";
import type { Statement } from "better-sqlite3";

// import database
const db = getDatabase(Databases.SONGS_DATA)

// rankings
function getRankingsFilterQueryParams(
    filterParams: RankingsFilterParams,
    daysOffset?: number
): SqlRankingsFilterParams {
    const queryParams: { [key: string]: any } = {
        timestamp: filterParams.timestamp || getMostRecentViewsTimestampSync(),
        timePeriodOffset: filterParams.timePeriodOffset,
        daysOffset: daysOffset == null ? filterParams.daysOffset : daysOffset + (filterParams.daysOffset || 0),
        viewType: filterParams.sourceType,
        songType: filterParams.songType,
        artistType: filterParams.artistType,
        publishDate: filterParams.publishDate || null,
        orderBy: filterParams.orderBy,
        direction: filterParams.direction,
        singleVideo: filterParams.singleVideo && 1 || null,
        maxEntries: filterParams.maxEntries,
        startAt: filterParams.startAt,
        minViews: filterParams.minViews,
        maxViews: filterParams.maxViews,
        search: filterParams.search
    }

    const buildInStatement = (values: Id[], prefix = '') => {
        const stringBuilder = []
        let n = 0
        for (const value in values) {
            const key = `${prefix}${n}`
            stringBuilder.push(`:${key}`)
            queryParams[key] = value
            n++
        }
        return stringBuilder.join(',')
    }

    // prepare build statements
    const filterParamsArtists = filterParams.artists
    const filterParamsSongs = filterParams.songs

    return {
        filterArtists: filterParamsArtists ? buildInStatement(filterParamsArtists, 'artist') : '',
        filterSongs: filterParamsSongs ? buildInStatement(filterParamsSongs, 'song') : '',
        params: queryParams
    }
}

function filterRankingsCountSync(
    queryParams: SqlRankingsFilterParams
): number {
    const filterArtists = queryParams.filterArtists
    const filterSongs = queryParams.filterSongs

    const filterArtistsStatement = filterArtists == '' ? '' : ` AND (songs_artists.artist_id IN (${filterArtists}))`
    const filterSongsStatement = filterSongs == '' ? '' : ` AND (songs.id IN (${filterSongs}))`
    return db.prepare(`
    SELECT views_breakdowns.song_id
    FROM views_breakdowns
    INNER JOIN songs ON views_breakdowns.song_id = songs.id
    INNER JOIN songs_artists ON songs_artists.song_id = views_breakdowns.song_id
    INNER JOIN songs_names ON songs_names.song_id = views_breakdowns.song_id
    INNER JOIN artists ON artists.id = songs_artists.artist_id
    WHERE (views_breakdowns.timestamp = CASE WHEN :daysOffset IS NULL
            THEN :timestamp
            ELSE DATE(:timestamp, '-' || :daysOffset || ' day')
            END)
        AND (views_breakdowns.view_type = :viewType OR :viewType IS NULL)
        AND (songs.song_type = :songType OR :songType IS NULL)
        AND (songs.publish_date LIKE :publishDate OR :publishDate IS NULL)
        AND (artists.artist_type = :artistType OR :artistType IS NULL)
        AND (songs_names.name LIKE :search OR :search IS NULL)
        AND (views_breakdowns.views = CASE WHEN :singleVideo IS NULL
            THEN views_breakdowns.views
            ELSE
                (SELECT MAX(sub_vb.views)
                FROM views_breakdowns AS sub_vb 
                INNER JOIN songs ON songs.id = sub_vb.song_id
                INNER JOIN songs_artists ON songs_artists.song_id = sub_vb.song_id
                INNER JOIN songs_names ON songs_names.song_id = views_breakdowns.song_id
                INNER JOIN artists ON artists.id = songs_artists.artist_id
                WHERE (sub_vb.view_type = views_breakdowns.view_type)
                    AND (sub_vb.timestamp = views_breakdowns.timestamp)
                    AND (sub_vb.song_id = views_breakdowns.song_id)
                    AND (songs.song_type = :songType OR :songType IS NULL)
                    AND (songs.publish_date LIKE :publishDate OR :publishDate IS NULL)
                    AND (artists.artist_type = :artistType OR :artistType IS NULL)
                    AND (songs_names.name LIKE :search OR :search IS NULL)${filterArtistsStatement}${filterSongsStatement}
                GROUP BY sub_vb.song_id)
            END)${filterArtistsStatement}${filterSongsStatement}
    GROUP BY views_breakdowns.song_id
    HAVING (CASE WHEN :minViews IS NULL
        THEN 1
        ELSE SUM(DISTINCT views_breakdowns.views) >= :minViews END)
        AND (CASE WHEN :maxViews IS NULL
            THEN 1
            ELSE SUM(DISTINCT views_breakdowns.views) <= :maxViews END)
    `).all(queryParams.params)?.length || 0
}

function filterRankingsRawSync(
    queryParams: SqlRankingsFilterParams
): RawRankingsResult[] {
    const filterArtists = queryParams.filterArtists
    const filterSongs = queryParams.filterSongs

    const filterArtistsStatement = filterArtists == '' ? '' : ` AND (songs_artists.artist_id IN (${filterArtists}))`
    const filterSongsStatement = filterSongs == '' ? '' : ` AND (songs.id IN (${filterSongs}))`

    return db.prepare(`
        SELECT DISTINCT views_breakdowns.song_id,
            CASE :orderBy
                WHEN 3 THEN (SUM(DISTINCT views_breakdowns.views) - CASE WHEN :timePeriodOffset IS NULL
                    THEN 0
                    ELSE ifnull((
                        SELECT SUM(DISTINCT offset_breakdowns.views) AS offset_views
                        FROM views_breakdowns AS offset_breakdowns
                        INNER JOIN songs ON songs.id = offset_breakdowns.song_id
                        INNER JOIN songs_artists ON songs_artists.song_id = offset_breakdowns.song_id
                        INNER JOIN songs_names ON songs_names.song_id = views_breakdowns.song_id
                        INNER JOIN artists ON artists.id = songs_artists.artist_id
                        WHERE (offset_breakdowns.timestamp = CASE WHEN :daysOffset IS NULL
                                THEN DATE(:timestamp, '-' || :timePeriodOffset || ' day')
                                ELSE DATE(DATE(:timestamp, '-' || :daysOffset || ' day'), '-' || :timePeriodOffset || ' day')
                                END)
                            AND (offset_breakdowns.song_id = views_breakdowns.song_id)
                            AND (offset_breakdowns.view_type = :viewType OR :viewType IS NULL)
                            AND (songs.song_type = :songType OR :songType IS NULL)
                            AND (songs.publish_date LIKE :publishDate OR :publishDate IS NULL)
                            AND (artists.artist_type = :artistType OR :artistType IS NULL)
                            AND (songs_names.name LIKE :search OR :search IS NULL)
                            AND (offset_breakdowns.views = CASE WHEN :singleVideo IS NULL
                                THEN offset_breakdowns.views
                                ELSE
                                    (SELECT MAX(offset_sub_breakdowns.views)
                                    FROM views_breakdowns AS offset_sub_breakdowns 
                                    INNER JOIN songs ON songs.id = offset_sub_breakdowns.song_id
                                    INNER JOIN songs_artists ON songs_artists.song_id = offset_sub_breakdowns.song_id
                                    INNER JOIN songs_names ON songs_names.song_id = views_breakdowns.song_id
                                    INNER JOIN artists ON artists.id = songs_artists.artist_id
                                    WHERE (offset_sub_breakdowns.view_type = offset_breakdowns.view_type)
                                        AND (offset_sub_breakdowns.timestamp = offset_breakdowns.timestamp)
                                        AND (offset_sub_breakdowns.song_id = offset_breakdowns.song_id)
                                        AND (songs.song_type = :songType OR :songType IS NULL)
                                        AND (songs.publish_date LIKE :publishDate OR :publishDate IS NULL)
                                        AND (artists.artist_type = :artistType OR :artistType IS NULL)
                                        AND (songs_names.name LIKE :search OR :search IS NULL)${filterArtistsStatement}${filterSongsStatement}
                                    GROUP BY offset_sub_breakdowns.song_id)
                                END)${filterArtistsStatement}${filterSongsStatement}
                        GROUP BY offset_breakdowns.song_id
                    ),SUM(DISTINCT views_breakdowns.views))
                END) * (1 / MAX(julianday('now') - julianday(songs.publish_date), 1))
                ELSE SUM(DISTINCT views_breakdowns.views) - CASE WHEN :timePeriodOffset IS NULL
                    THEN 0
                    ELSE ifnull((
                        SELECT SUM(DISTINCT offset_breakdowns.views) AS offset_views
                        FROM views_breakdowns AS offset_breakdowns
                        INNER JOIN songs ON songs.id = offset_breakdowns.song_id
                        INNER JOIN songs_artists ON songs_artists.song_id = offset_breakdowns.song_id
                        INNER JOIN songs_names ON songs_names.song_id = views_breakdowns.song_id
                        INNER JOIN artists ON artists.id = songs_artists.artist_id
                        WHERE (offset_breakdowns.timestamp = CASE WHEN :daysOffset IS NULL
                                THEN DATE(:timestamp, '-' || :timePeriodOffset || ' day')
                                ELSE DATE(DATE(:timestamp, '-' || :daysOffset || ' day'), '-' || :timePeriodOffset || ' day')
                                END)
                            AND (offset_breakdowns.song_id = views_breakdowns.song_id)
                            AND (offset_breakdowns.view_type = :viewType OR :viewType IS NULL)
                            AND (songs.song_type = :songType OR :songType IS NULL)
                            AND (songs.publish_date LIKE :publishDate OR :publishDate IS NULL)
                            AND (artists.artist_type = :artistType OR :artistType IS NULL)
                            AND (songs_names.name LIKE :search OR :search IS NULL)
                            AND (offset_breakdowns.views = CASE WHEN :singleVideo IS NULL
                                THEN offset_breakdowns.views
                                ELSE
                                    (SELECT MAX(offset_sub_breakdowns.views)
                                    FROM views_breakdowns AS offset_sub_breakdowns 
                                    INNER JOIN songs ON songs.id = offset_sub_breakdowns.song_id
                                    INNER JOIN songs_artists ON songs_artists.song_id = offset_sub_breakdowns.song_id
                                    INNER JOIN songs_names ON songs_names.song_id = views_breakdowns.song_id
                                    INNER JOIN artists ON artists.id = songs_artists.artist_id
                                    WHERE (offset_sub_breakdowns.view_type = offset_breakdowns.view_type)
                                        AND (offset_sub_breakdowns.timestamp = offset_breakdowns.timestamp)
                                        AND (offset_sub_breakdowns.song_id = offset_breakdowns.song_id)
                                        AND (songs.song_type = :songType OR :songType IS NULL)
                                        AND (songs.publish_date LIKE :publishDate OR :publishDate IS NULL)
                                        AND (artists.artist_type = :artistType OR :artistType IS NULL)
                                        AND (songs_names.name LIKE :search OR :search IS NULL)${filterArtistsStatement}${filterSongsStatement}
                                    GROUP BY offset_sub_breakdowns.song_id)
                                END)${filterArtistsStatement}${filterSongsStatement}
                        GROUP BY offset_breakdowns.song_id
                    ), CASE WHEN julianday(:timestamp) - julianday(songs.publish_date) <= :timePeriodOffset THEN 0 ELSE (
                        SELECT SUM(DISTINCT offset_breakdowns.views) AS offset_views
                        FROM views_breakdowns AS offset_breakdowns
                        INNER JOIN songs ON songs.id = offset_breakdowns.song_id
                        INNER JOIN songs_artists ON songs_artists.song_id = offset_breakdowns.song_id
                        INNER JOIN songs_names ON songs_names.song_id = views_breakdowns.song_id
                        INNER JOIN artists ON artists.id = songs_artists.artist_id
                        WHERE (offset_breakdowns.timestamp = DATE(:timestamp, '-' || (julianday(:timestamp) - julianday(songs.addition_date) - 1) || ' day'))
                            AND (offset_breakdowns.song_id = views_breakdowns.song_id)
                            AND (offset_breakdowns.view_type = :viewType OR :viewType IS NULL)
                            AND (songs.song_type = :songType OR :songType IS NULL)
                            AND (songs.publish_date LIKE :publishDate OR :publishDate IS NULL)
                            AND (artists.artist_type = :artistType OR :artistType IS NULL)
                            AND (songs_names.name LIKE :search OR :search IS NULL)
                            AND (offset_breakdowns.views = CASE WHEN :singleVideo IS NULL
                                THEN offset_breakdowns.views
                                ELSE
                                    (SELECT MAX(offset_sub_breakdowns.views)
                                    FROM views_breakdowns AS offset_sub_breakdowns 
                                    INNER JOIN songs ON songs.id = offset_sub_breakdowns.song_id
                                    INNER JOIN songs_artists ON songs_artists.song_id = offset_sub_breakdowns.song_id
                                    INNER JOIN songs_names ON songs_names.song_id = views_breakdowns.song_id
                                    INNER JOIN artists ON artists.id = songs_artists.artist_id
                                    WHERE (offset_sub_breakdowns.view_type = offset_breakdowns.view_type)
                                        AND (offset_sub_breakdowns.timestamp = offset_breakdowns.timestamp)
                                        AND (offset_sub_breakdowns.song_id = offset_breakdowns.song_id)
                                        AND (songs.song_type = :songType OR :songType IS NULL)
                                        AND (songs.publish_date LIKE :publishDate OR :publishDate IS NULL)
                                        AND (artists.artist_type = :artistType OR :artistType IS NULL)
                                        AND (songs_names.name LIKE :search OR :search IS NULL)${filterArtistsStatement}${filterSongsStatement}
                                    GROUP BY offset_sub_breakdowns.song_id)
                                END)${filterArtistsStatement}${filterSongsStatement}
                        GROUP BY offset_breakdowns.song_id
                        ) END)
                END 
            END AS total_views
        FROM views_breakdowns
        INNER JOIN songs ON views_breakdowns.song_id = songs.id
        INNER JOIN songs_artists ON songs_artists.song_id = views_breakdowns.song_id
        INNER JOIN songs_names ON songs_names.song_id = views_breakdowns.song_id
        INNER JOIN artists ON artists.id = songs_artists.artist_id
        WHERE (views_breakdowns.timestamp = CASE WHEN :daysOffset IS NULL
                THEN :timestamp
                ELSE DATE(:timestamp, '-' || :daysOffset || ' day')
                END)
            AND (views_breakdowns.view_type = :viewType OR :viewType IS NULL)
            AND (songs.song_type = :songType OR :songType IS NULL)
            AND (songs.publish_date LIKE :publishDate OR :publishDate IS NULL)
            AND (artists.artist_type = :artistType OR :artistType IS NULL)
            AND (songs_names.name LIKE :search OR :search IS NULL)
            AND (views_breakdowns.views = CASE WHEN :singleVideo IS NULL
                THEN views_breakdowns.views
                ELSE
                    (SELECT MAX(sub_vb.views)
                    FROM views_breakdowns AS sub_vb 
                    INNER JOIN songs ON songs.id = sub_vb.song_id
                    INNER JOIN songs_artists ON songs_artists.song_id = sub_vb.song_id
                    INNER JOIN artists ON artists.id = songs_artists.artist_id
                    WHERE (sub_vb.view_type = views_breakdowns.view_type)
                        AND (sub_vb.timestamp = views_breakdowns.timestamp)
                        AND (sub_vb.song_id = views_breakdowns.song_id)
                        AND (songs.song_type = :songType OR :songType IS NULL)
                        AND (songs.publish_date LIKE :publishDate OR :publishDate IS NULL)
                        AND (artists.artist_type = :artistType OR :artistType IS NULL)${filterArtistsStatement}${filterSongsStatement}
                    GROUP BY sub_vb.song_id)
                END)${filterArtistsStatement}${filterSongsStatement}
        GROUP BY views_breakdowns.song_id
        HAVING (CASE WHEN :minViews IS NULL
            THEN 1
            ELSE total_views >= :minViews END)
            AND (CASE WHEN :maxViews IS NULL
                THEN 1
                ELSE total_views <= :maxViews END)
        ORDER BY
            CASE WHEN :direction = 0 THEN 1
            ELSE
                CASE :orderBy
                    WHEN 1 
                        THEN DATE(songs.publish_date)
                    WHEN 2 
                        THEN DATE(songs.addition_date)
                    ELSE total_views
                END
            END ASC,
            CASE WHEN :direction = 1 THEN 1
            ELSE
                CASE :orderBy
                    WHEN 1 
                        THEN DATE(songs.publish_date)
                    WHEN 2 
                        THEN DATE(songs.addition_date)
                    ELSE total_views
                END
            END DESC
        LIMIT :maxEntries
        OFFSET :startAt`).all(queryParams.params) as RawRankingsResult[]
}

function filterRankingsSync(
    filterParams: RankingsFilterParams
): RankingsFilterResult {
    const queryParams = getRankingsFilterQueryParams(filterParams)

    const primaryResult = filterRankingsRawSync(queryParams)
    // handle change offset
    const changeOffset = filterParams.changeOffset
    const changeOffsetMap: { [key: string]: number } = {}
    if (changeOffset && changeOffset > 0) {
        const changeOffsetResult = filterRankingsRawSync(getRankingsFilterQueryParams(filterParams, changeOffset))
        for (let placement = 0; placement < changeOffsetResult.length; placement++) {
            changeOffsetMap[changeOffsetResult[placement].song_id.toString()] = placement
        }
    }

    const returnEntries: RankingsFilterResultItem[] = []
    // generate rankings entries
    const placementOffset = filterParams.startAt
    let placement = 0
    for (const data of primaryResult) {
        const songId = data.song_id
        const previousPlacement = changeOffsetMap[songId.toString()] || placement
        try {
            const songData = getSongSync(songId, false)
            if (songData) {
                returnEntries.push({
                    placement: placement + 1 + placementOffset,
                    change: previousPlacement == placement ? PlacementChange.SAME :
                        (placement > previousPlacement ? PlacementChange.DOWN : PlacementChange.UP),
                    previousPlacement: previousPlacement,
                    views: data.total_views,
                    song: songData
                })
                placement++
            }
        } catch (error) { }
    }

    // get entry count
    const entryCount = filterRankingsCountSync(queryParams)

    return {
        totalCount: entryCount,
        timestamp: queryParams.params['timestamp'] as string,
        results: returnEntries
    }
}

export function filterRankings(
    filterParams: RankingsFilterParams
): Promise<RankingsFilterResult> {
    return new Promise((resolve, reject) => {
        try {
            resolve(filterRankingsSync(filterParams))
        } catch (error) {
            reject(error)
        }
    })
}

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
    if (!timestamp) {
        return {
            range: range,
            period: period,
            startAt: timestamp,
            largest: 0,
            views: []
        }
    }
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