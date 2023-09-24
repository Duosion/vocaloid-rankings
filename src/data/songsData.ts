import getDatabase, { generateTimestamp } from ".";
import { Databases } from ".";
import { Artist, ArtistCategory, ArtistPlacement, ArtistThumbnailType, ArtistType, HistoricalViews, HistoricalViewsResult, Id, NameType, Names, PlacementChange, SongRankingsFilterParams, SongRankingsFilterResult, SongRankingsFilterResultItem, RawArtistData, RawArtistName, RawArtistThumbnail, RawSongRankingsResult, RawSongArtist, RawSongData, RawSongName, RawSongVideoId, RawViewBreakdown, Song, SongPlacement, SongType, SongVideoIds, SourceType, SqlRankingsFilterParams, Views, ViewsBreakdown, ArtistRankingsFilterParams, ArtistRankingsFilterResult, ArtistRankingsFilterResultItem, RawArtistRankingResult } from "./types";
import type { Statement } from "better-sqlite3";

// import database
const db = getDatabase(Databases.SONGS_DATA)

// rankings
function getSongRankingsFilterQueryParams(
    filterParams: SongRankingsFilterParams,
    daysOffset?: number
): SqlRankingsFilterParams {
    const queryParams: { [key: string]: any } = {
        timestamp: filterParams.timestamp || getMostRecentViewsTimestampSync(),
        timePeriodOffset: filterParams.timePeriodOffset,
        daysOffset: daysOffset == null ? filterParams.daysOffset : daysOffset + (filterParams.daysOffset || 0),
        publishDate: filterParams.publishDate || null,
        orderBy: filterParams.orderBy,
        direction: filterParams.direction,
        singleVideo: filterParams.singleVideo && 1 || null,
        maxEntries: filterParams.maxEntries,
        startAt: filterParams.startAt,
        minViews: filterParams.minViews,
        maxViews: filterParams.maxViews,
        search: filterParams.search?.toLowerCase()
    }

    const buildInStatement = (values: Id[], prefix = '') => {
        const stringBuilder = []
        let n = 0
        for (const value of values) {
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
    // source types
    const filterParamsIncludeSourceTypes = filterParams.includeSourceTypes
    const filterParamsExcludeSourceTypes = filterParams.excludeSourceTypes
    // song types
    const filterParamsIncludeSongTypes = filterParams.includeSongTypes
    const filterParamsExcludeSongTypes = filterParams.excludeSongTypes
    // artist types
    const filterParamsIncludeArtistTypes = filterParams.includeArtistTypes
    const filterParamsExcludeArtistTypes = filterParams.excludeArtistTypes

    return {
        filterArtists: filterParamsArtists ? buildInStatement(filterParamsArtists, 'artist') : '',
        filterSongs: filterParamsSongs ? buildInStatement(filterParamsSongs, 'song') : '',
        filterIncludeSourceTypes: filterParamsIncludeSourceTypes && buildInStatement(filterParamsIncludeSourceTypes, 'includeSourceTypes'),
        filterExcludeSourceTypes: filterParamsExcludeSourceTypes && buildInStatement(filterParamsExcludeSourceTypes, 'excludeSourceTypes'),
        filterIncludeSongTypes: filterParamsIncludeSongTypes && buildInStatement(filterParamsIncludeSongTypes, 'includeSongTypes'),
        filterExcludeSongTypes: filterParamsExcludeSongTypes && buildInStatement(filterParamsExcludeSongTypes, 'excludeSongTypes'),
        filterIncludeArtistTypes: filterParamsIncludeArtistTypes && buildInStatement(filterParamsIncludeArtistTypes, 'includeArtistTypes'),
        filterExcludeArtistTypes: filterParamsExcludeArtistTypes && buildInStatement(filterParamsExcludeArtistTypes, 'excludeArtistTypes'),
        params: queryParams
    }
}

function filterSongRankingsCountSync(
    queryParams: SqlRankingsFilterParams
): number {
    const filterArtists = queryParams.filterArtists
    const filterSongs = queryParams.filterSongs
    const filterIncludeSourceTypes = queryParams.filterIncludeSourceTypes
    const filterExcludeSourceTypes = queryParams.filterExcludeSourceTypes
    const filterIncludeSongTypes = queryParams.filterIncludeSongTypes
    const filterExcludeSongTypes = queryParams.filterExcludeSongTypes
    const filterIncludeArtistTypes = queryParams.filterIncludeArtistTypes
    const filterExcludeArtistTypes = queryParams.filterExcludeArtistTypes

    const filterArtistsStatement = filterArtists == '' ? '' : ` AND (songs_artists.artist_id IN (${filterArtists}))`
    const filterSongsStatement = filterSongs == '' ? '' : ` AND (songs.id IN (${filterSongs}))`
    // source types
    const filterIncludeSourceTypesStatement = filterIncludeSourceTypes ? ` AND (views_breakdowns.view_type IN (${filterIncludeSourceTypes}))` : ''
    const filterExcludeSourceTypesStatement = filterExcludeSourceTypes ? ` AND (views_breakdowns.view_type NOT IN (${filterExcludeSourceTypes}))` : ''
    const filterOffsetIncludeSourceTypesStatement = filterIncludeSourceTypes ? ` AND (offset_breakdowns.view_type IN (${filterIncludeSourceTypes}))` : ''
    const filterOffsetExcludeSourceTypesStatement = filterExcludeSourceTypes ? ` AND (offset_breakdowns.view_type NOT IN (${filterExcludeSourceTypes}))` : ''
    // song types
    const filterIncludeSongTypesStatement = filterIncludeSongTypes ? ` AND (songs.song_type IN (${filterIncludeSongTypes}))` : ''
    const filterExcludeSongTypesStatement = filterExcludeSongTypes ? ` AND (songs.song_type NOT IN (${filterExcludeSongTypes}))` : ''
    // artist types
    const filterIncludeArtistTypesStatement = filterIncludeArtistTypes ? ` AND EXISTS (
        SELECT 1 
        FROM artists 
        INNER JOIN songs_artists sa ON sa.artist_id = artists.id 
        WHERE sa.song_id = views_breakdowns.song_id 
        AND artists.artist_type IN (${filterIncludeArtistTypes})
    )` : ''
    const filterExcludeArtistTypesStatement = filterExcludeArtistTypes ? ` AND NOT EXISTS (
        SELECT 1 
        FROM artists 
        INNER JOIN songs_artists sa ON sa.artist_id = artists.id 
        WHERE sa.song_id = views_breakdowns.song_id 
        AND artists.artist_type IN (${filterExcludeArtistTypes})
    )` : ''

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
        AND (songs.publish_date LIKE :publishDate OR :publishDate IS NULL)
        AND (songs_names.name LIKE :search OR :search IS NULL)
        AND (views_breakdowns.views = CASE WHEN :singleVideo IS NULL
            THEN views_breakdowns.views
            ELSE
                (SELECT MAX(offset_breakdowns.views)
                FROM views_breakdowns AS offset_breakdowns 
                INNER JOIN songs ON songs.id = offset_breakdowns.song_id
                INNER JOIN songs_artists ON songs_artists.song_id = offset_breakdowns.song_id
                INNER JOIN songs_names ON songs_names.song_id = views_breakdowns.song_id
                INNER JOIN artists ON artists.id = songs_artists.artist_id
                WHERE (offset_breakdowns.timestamp = views_breakdowns.timestamp)
                    AND (offset_breakdowns.song_id = views_breakdowns.song_id)
                    AND (songs.publish_date LIKE :publishDate OR :publishDate IS NULL)
                    AND (songs_names.name LIKE :search OR :search IS NULL)${filterOffsetIncludeSourceTypesStatement}${filterOffsetExcludeSourceTypesStatement}${filterIncludeSongTypesStatement}${filterExcludeSongTypesStatement}${filterIncludeArtistTypesStatement}${filterExcludeArtistTypesStatement}${filterArtistsStatement}${filterSongsStatement}
                GROUP BY offset_breakdowns.song_id)
            END)${filterIncludeSourceTypesStatement}${filterExcludeSourceTypesStatement}${filterIncludeSongTypesStatement}${filterExcludeSongTypesStatement}${filterIncludeArtistTypesStatement}${filterExcludeArtistTypesStatement}${filterArtistsStatement}${filterSongsStatement}
    GROUP BY views_breakdowns.song_id
    HAVING (CASE WHEN :minViews IS NULL
        THEN 1
        ELSE SUM(DISTINCT views_breakdowns.views) >= :minViews END)
        AND (CASE WHEN :maxViews IS NULL
            THEN 1
            ELSE SUM(DISTINCT views_breakdowns.views) <= :maxViews END)
    `).all(queryParams.params)?.length || 0
}

function filterSongRankingsRawSync(
    queryParams: SqlRankingsFilterParams
): RawSongRankingsResult[] {
    const filterArtists = queryParams.filterArtists
    const filterSongs = queryParams.filterSongs
    const filterIncludeSourceTypes = queryParams.filterIncludeSourceTypes
    const filterExcludeSourceTypes = queryParams.filterExcludeSourceTypes
    const filterIncludeSongTypes = queryParams.filterIncludeSongTypes
    const filterExcludeSongTypes = queryParams.filterExcludeSongTypes
    const filterIncludeArtistTypes = queryParams.filterIncludeArtistTypes
    const filterExcludeArtistTypes = queryParams.filterExcludeArtistTypes

    const filterArtistsStatement = filterArtists == '' ? '' : ` AND (songs_artists.artist_id IN (${filterArtists}))`
    const filterSongsStatement = filterSongs == '' ? '' : ` AND (songs.id IN (${filterSongs}))`
    // source types
    const filterIncludeSourceTypesStatement = filterIncludeSourceTypes ? ` AND (views_breakdowns.view_type IN (${filterIncludeSourceTypes}))` : ''
    const filterExcludeSourceTypesStatement = filterExcludeSourceTypes ? ` AND (views_breakdowns.view_type NOT IN (${filterExcludeSourceTypes}))` : ''
    const filterOffsetIncludeSourceTypesStatement = filterIncludeSourceTypes ? ` AND (offset_breakdowns.view_type IN (${filterIncludeSourceTypes}))` : ''
    const filterOffsetExcludeSourceTypesStatement = filterExcludeSourceTypes ? ` AND (offset_breakdowns.view_type NOT IN (${filterExcludeSourceTypes}))` : ''
    const filterOffsetSubIncludeSourceTypesStatement = filterIncludeSourceTypes ? ` AND (offset_sub_breakdowns.view_type IN (${filterIncludeSourceTypes}))` : ''
    const filterOffsetSubExcludeSourceTypesStatement = filterExcludeSourceTypes ? ` AND (offset_sub_breakdowns.view_type NOT IN (${filterExcludeSourceTypes}))` : ''
    // song types
    const filterIncludeSongTypesStatement = filterIncludeSongTypes ? ` AND (songs.song_type IN (${filterIncludeSongTypes}))` : ''
    const filterExcludeSongTypesStatement = filterExcludeSongTypes ? ` AND (songs.song_type NOT IN (${filterExcludeSongTypes}))` : ''
    // artist types
    const filterIncludeArtistTypesStatement = filterIncludeArtistTypes ? ` AND EXISTS (
        SELECT 1 
        FROM artists 
        INNER JOIN songs_artists sa ON sa.artist_id = artists.id 
        WHERE sa.song_id = views_breakdowns.song_id 
        AND artists.artist_type IN (${filterIncludeArtistTypes})
    )` : ''
    const filterExcludeArtistTypesStatement = filterExcludeArtistTypes ? ` AND NOT EXISTS (
        SELECT 1 
        FROM artists 
        INNER JOIN songs_artists sa ON sa.artist_id = artists.id 
        WHERE sa.song_id = views_breakdowns.song_id 
        AND artists.artist_type IN (${filterExcludeArtistTypes})
    )` : ''

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
                            AND (songs.publish_date LIKE :publishDate OR :publishDate IS NULL)
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
                                    WHERE (offset_sub_breakdowns.timestamp = offset_breakdowns.timestamp)
                                        AND (offset_sub_breakdowns.song_id = offset_breakdowns.song_id)
                                        AND (songs.publish_date LIKE :publishDate OR :publishDate IS NULL)
                                        AND (songs_names.name LIKE :search OR :search IS NULL)${filterOffsetSubIncludeSourceTypesStatement}${filterOffsetSubExcludeSourceTypesStatement}${filterIncludeSongTypesStatement}${filterExcludeSongTypesStatement}${filterIncludeArtistTypesStatement}${filterExcludeArtistTypesStatement}${filterArtistsStatement}${filterSongsStatement}
                                    GROUP BY offset_sub_breakdowns.song_id)
                                END)${filterOffsetIncludeSourceTypesStatement}${filterOffsetExcludeSourceTypesStatement}${filterIncludeSongTypesStatement}${filterExcludeSongTypesStatement}${filterIncludeArtistTypesStatement}${filterExcludeArtistTypesStatement}${filterArtistsStatement}${filterSongsStatement}
                        GROUP BY offset_breakdowns.song_id
                    ), CASE WHEN julianday(:timestamp) - julianday(songs.publish_date) <= :timePeriodOffset THEN 0 ELSE (
                        SELECT SUM(DISTINCT offset_breakdowns.views) AS offset_views
                        FROM views_breakdowns AS offset_breakdowns
                        INNER JOIN songs ON songs.id = offset_breakdowns.song_id
                        INNER JOIN songs_artists ON songs_artists.song_id = offset_breakdowns.song_id
                        INNER JOIN songs_names ON songs_names.song_id = views_breakdowns.song_id
                        INNER JOIN artists ON artists.id = songs_artists.artist_id
                        WHERE (offset_breakdowns.timestamp = DATE(:timestamp, '-' || ((julianday(:timestamp) - julianday(songs.addition_date)) + 1) || ' day')
                                OR offset_breakdowns.timestamp = DATE(:timestamp, '-' || (julianday(:timestamp) - julianday(songs.addition_date)) || ' day'))
                            AND (offset_breakdowns.song_id = views_breakdowns.song_id)
                            AND (songs.publish_date LIKE :publishDate OR :publishDate IS NULL)
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
                                    WHERE (offset_sub_breakdowns.timestamp = offset_breakdowns.timestamp)
                                        AND (offset_sub_breakdowns.song_id = offset_breakdowns.song_id)
                                        AND (songs.publish_date LIKE :publishDate OR :publishDate IS NULL)
                                        AND (songs_names.name LIKE :search OR :search IS NULL)${filterOffsetSubIncludeSourceTypesStatement}${filterOffsetSubExcludeSourceTypesStatement}${filterIncludeSongTypesStatement}${filterExcludeSongTypesStatement}${filterIncludeArtistTypesStatement}${filterExcludeArtistTypesStatement}${filterArtistsStatement}${filterSongsStatement}
                                    GROUP BY offset_sub_breakdowns.song_id)
                                END)${filterOffsetIncludeSourceTypesStatement}${filterOffsetExcludeSourceTypesStatement}${filterIncludeSongTypesStatement}${filterExcludeSongTypesStatement}${filterIncludeArtistTypesStatement}${filterExcludeArtistTypesStatement}${filterArtistsStatement}${filterSongsStatement}
                        GROUP BY offset_breakdowns.song_id
                        ) END)
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
                            AND (songs.publish_date LIKE :publishDate OR :publishDate IS NULL)
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
                                    WHERE (offset_sub_breakdowns.timestamp = offset_breakdowns.timestamp)
                                        AND (offset_sub_breakdowns.song_id = offset_breakdowns.song_id)
                                        AND (songs.publish_date LIKE :publishDate OR :publishDate IS NULL)
                                        AND (songs_names.name LIKE :search OR :search IS NULL)${filterOffsetSubIncludeSourceTypesStatement}${filterOffsetSubExcludeSourceTypesStatement}${filterIncludeSongTypesStatement}${filterExcludeSongTypesStatement}${filterIncludeArtistTypesStatement}${filterExcludeArtistTypesStatement}${filterArtistsStatement}${filterSongsStatement}
                                    GROUP BY offset_sub_breakdowns.song_id)
                                END)${filterOffsetIncludeSourceTypesStatement}${filterOffsetExcludeSourceTypesStatement}${filterIncludeSongTypesStatement}${filterExcludeSongTypesStatement}${filterIncludeArtistTypesStatement}${filterExcludeArtistTypesStatement}${filterArtistsStatement}${filterSongsStatement}
                        GROUP BY offset_breakdowns.song_id
                    ), CASE WHEN julianday(:timestamp) - julianday(songs.publish_date) <= :timePeriodOffset THEN 0 ELSE (
                        SELECT SUM(DISTINCT offset_breakdowns.views) AS offset_views
                        FROM views_breakdowns AS offset_breakdowns
                        INNER JOIN songs ON songs.id = offset_breakdowns.song_id
                        INNER JOIN songs_artists ON songs_artists.song_id = offset_breakdowns.song_id
                        INNER JOIN songs_names ON songs_names.song_id = views_breakdowns.song_id
                        INNER JOIN artists ON artists.id = songs_artists.artist_id
                        WHERE (offset_breakdowns.timestamp = DATE(:timestamp, '-' || ((julianday(:timestamp) - julianday(songs.addition_date)) + 1) || ' day')
                                OR offset_breakdowns.timestamp = DATE(:timestamp, '-' || (julianday(:timestamp) - julianday(songs.addition_date)) || ' day'))
                            AND (offset_breakdowns.song_id = views_breakdowns.song_id)
                            AND (songs.publish_date LIKE :publishDate OR :publishDate IS NULL)
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
                                    WHERE (offset_sub_breakdowns.timestamp = offset_breakdowns.timestamp)
                                        AND (offset_sub_breakdowns.song_id = offset_breakdowns.song_id)
                                        AND (songs.publish_date LIKE :publishDate OR :publishDate IS NULL)
                                        AND (songs_names.name LIKE :search OR :search IS NULL)${filterOffsetSubIncludeSourceTypesStatement}${filterOffsetSubExcludeSourceTypesStatement}${filterIncludeSongTypesStatement}${filterExcludeSongTypesStatement}${filterIncludeArtistTypesStatement}${filterExcludeArtistTypesStatement}${filterArtistsStatement}${filterSongsStatement}
                                    GROUP BY offset_sub_breakdowns.song_id)
                                END)${filterOffsetIncludeSourceTypesStatement}${filterOffsetExcludeSourceTypesStatement}${filterIncludeSongTypesStatement}${filterExcludeSongTypesStatement}${filterIncludeArtistTypesStatement}${filterExcludeArtistTypesStatement}${filterArtistsStatement}${filterSongsStatement}
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
            AND (songs.publish_date LIKE :publishDate OR :publishDate IS NULL)
            AND (lower(songs_names.name) LIKE :search OR :search IS NULL)
            AND (views_breakdowns.views = CASE WHEN :singleVideo IS NULL
                THEN views_breakdowns.views
                ELSE
                    (SELECT MAX(offset_breakdowns.views)
                    FROM views_breakdowns AS offset_breakdowns 
                    INNER JOIN songs ON songs.id = offset_breakdowns.song_id
                    INNER JOIN songs_artists ON songs_artists.song_id = offset_breakdowns.song_id
                    INNER JOIN artists ON artists.id = songs_artists.artist_id
                    WHERE (offset_breakdowns.timestamp = views_breakdowns.timestamp)
                        AND (offset_breakdowns.song_id = views_breakdowns.song_id)
                        AND (songs.publish_date LIKE :publishDate OR :publishDate IS NULL)${filterOffsetIncludeSourceTypesStatement}${filterOffsetExcludeSourceTypesStatement}${filterIncludeSongTypesStatement}${filterExcludeSongTypesStatement}${filterIncludeArtistTypesStatement}${filterExcludeArtistTypesStatement}${filterArtistsStatement}${filterSongsStatement}
                    GROUP BY offset_breakdowns.song_id)
                END)${filterIncludeSourceTypesStatement}${filterExcludeSourceTypesStatement}${filterIncludeSongTypesStatement}${filterExcludeSongTypesStatement}${filterIncludeArtistTypesStatement}${filterExcludeArtistTypesStatement}${filterArtistsStatement}${filterSongsStatement}
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
        OFFSET :startAt`).all(queryParams.params) as RawSongRankingsResult[]
}

function filterSongRankingsSync(
    filterParams: SongRankingsFilterParams = new SongRankingsFilterParams()
): SongRankingsFilterResult {
    const queryParams = getSongRankingsFilterQueryParams(filterParams)

    const primaryResult = filterSongRankingsRawSync(queryParams)
    // handle change offset
    const changeOffset = filterParams.changeOffset
    const changeOffsetMap: { [key: string]: number } = {}
    if (changeOffset && changeOffset > 0) {
        const changeOffsetResult = filterSongRankingsRawSync(getSongRankingsFilterQueryParams(filterParams, changeOffset))
        for (let placement = 0; placement < changeOffsetResult.length; placement++) {
            changeOffsetMap[changeOffsetResult[placement].song_id.toString()] = placement
        }
    }

    const returnEntries: SongRankingsFilterResultItem[] = []
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
    const entryCount = filterSongRankingsCountSync(queryParams)

    return {
        totalCount: entryCount,
        timestamp: queryParams.params['timestamp'] as string,
        results: returnEntries
    }
}

export function filterSongRankings(
    filterParams?: SongRankingsFilterParams
): Promise<SongRankingsFilterResult> {
    return new Promise((resolve, reject) => {
        try {
            resolve(filterSongRankingsSync(filterParams))
        } catch (error) {
            reject(error)
        }
    })
}

// Artist Rankings
function getFilterArtistsQueryParams(
    filterParams: ArtistRankingsFilterParams,
    daysOffset?: number
): SqlRankingsFilterParams {
    const queryParams: { [key: string]: any } = {
        timestamp: filterParams.timestamp || getMostRecentViewsTimestampSync(),
        daysOffset: daysOffset == undefined ? filterParams.daysOffset : daysOffset + (filterParams.daysOffset || 0),
        artistCategory: filterParams.artistCategory,
        combineSimilarArtists: filterParams.combineSimilarArtists ? 1 : null,
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

function filterArtistRankingsCountSync(
    queryParams: SqlRankingsFilterParams
) {
    const filterSongs = queryParams.filterSongs
    const filterArtists = queryParams.filterArtists
    return (db.prepare(`
    SELECT 
        COUNT(DISTINCT 
            CASE WHEN :combineSimilarArtists IS NULL THEN artists.id
            WHEN artists.base_artist_id IS NULL THEN artists.id
            ELSE (
                WITH RECURSIVE ancestor_path(id, base_artist_id) AS (
                    SELECT sub_artists.id, sub_artists.base_artist_id
                    FROM artists AS sub_artists
                    WHERE id = artists.id
                  
                    UNION ALL

                    SELECT a.id, a.base_artist_id
                    FROM artists a
                    JOIN ancestor_path ap ON a.id = ap.base_artist_id
                  )
                SELECT id
                FROM ancestor_path
                WHERE base_artist_id IS NULL
            )
        END) AS count
    FROM views_breakdowns
    INNER JOIN songs ON views_breakdowns.song_id = songs.id
    INNER JOIN songs_artists ON songs_artists.song_id = views_breakdowns.song_id
    INNER JOIN artists ON artists.id = songs_artists.artist_id
    INNER JOIN songs_artists AS song_co_artists ON song_co_artists.song_id = views_breakdowns.song_id
    INNER JOIN artists AS co_artists ON co_artists.id = song_co_artists.artist_id
    INNER JOIN songs_names ON songs_names.song_id = views_breakdowns.song_id
    WHERE (views_breakdowns.timestamp = CASE WHEN :daysOffset IS NULL
        THEN :timestamp
        ELSE DATE(:timestamp, '-' || :daysOffset || ' day')
        END)
        AND (views_breakdowns.view_type = :viewType OR :viewType IS NULL)
        AND (songs.song_type = :songType OR :songType IS NULL)
        AND (songs.publish_date LIKE :publishDate OR :publishDate IS NULL)
        AND (songs_artists.artist_category = :artistCategory OR :artistCategory IS NULL)
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
                INNER JOIN songs_artists AS song_co_artists ON song_co_artists.song_id = views_breakdowns.song_id
                INNER JOIN artists AS co_artists ON co_artists.id = song_co_artists.artist_id
                INNER JOIN songs_names ON songs_names.song_id = views_breakdowns.song_id
                WHERE (sub_vb.view_type = views_breakdowns.view_type)
                    AND (sub_vb.timestamp = views_breakdowns.timestamp)
                    AND (sub_vb.song_id = views_breakdowns.song_id)
                    AND (songs.song_type = :songType OR :songType IS NULL)
                    AND (songs.publish_date LIKE :publishDate OR :publishDate IS NULL)
                    AND (songs_artists.artist_category = :artistCategory OR :artistCategory IS NULL)
                    AND (artists.artist_type = :artistType OR :artistType IS NULL)
                    AND (songs_names.name LIKE :search OR :search IS NULL)
                    ${filterSongs == '' ? '' : `AND (songs.id IN (${filterSongs}))`}
                    ${filterArtists == '' ? '' : `AND (co_artists.id IN (${filterArtists}))`}
                GROUP BY sub_vb.song_id)
            END)
        ${filterSongs == '' ? '' : `AND (songs.id IN (${filterSongs}))`}
        ${filterArtists == '' ? '' : `AND (co_artists.id IN (${filterArtists}))`}
    GROUP BY 
        CASE WHEN :combineSimilarArtists IS NULL THEN artists.id
        WHEN artists.base_artist_id IS NULL then artists.id
        ELSE (
            WITH RECURSIVE ancestor_path(id, base_artist_id) AS (
                SELECT sub_artists.id, sub_artists.base_artist_id
                FROM artists AS sub_artists
                WHERE id = artists.id
              
                UNION ALL

                SELECT a.id, a.base_artist_id
                FROM artists a
                JOIN ancestor_path ap ON a.id = ap.base_artist_id
              )
            SELECT id
            FROM ancestor_path
            WHERE base_artist_id IS NULL
        )
        END
    HAVING (CASE WHEN :minViews IS NULL
        THEN 1
        ELSE SUM(DISTINCT views_breakdowns.views) >= :minViews END)
        AND (CASE WHEN :maxViews IS NULL
            THEN 1
            ELSE SUM(DISTINCT views_breakdowns.views) <= :maxViews 
            END)`).get(queryParams.params) as { count: number })?.count || 0
}

function filterArtistRankingsRawSync(
    queryParams: SqlRankingsFilterParams
): RawArtistRankingResult[] {
    const filterSongs = queryParams.filterSongs
    const filterArtists = queryParams.filterArtists
    return db.prepare(`
    SELECT DISTINCT 
        CASE WHEN :combineSimilarArtists IS NULL THEN artists.id
            WHEN artists.base_artist_id IS NULL THEN artists.id
            ELSE (
                WITH RECURSIVE ancestor_path(id, base_artist_id) AS (
                    SELECT sub_artists.id, sub_artists.base_artist_id
                    FROM artists AS sub_artists
                    WHERE id = artists.id
                  
                    UNION ALL

                    SELECT a.id, a.base_artist_id
                    FROM artists a
                    JOIN ancestor_path ap ON a.id = ap.base_artist_id
                  )
                SELECT id
                FROM ancestor_path
                WHERE base_artist_id IS NULL
            )
        END AS artist_id,
        SUM(DISTINCT views_breakdowns.views) AS total_views
    FROM views_breakdowns
    INNER JOIN songs ON views_breakdowns.song_id = songs.id
    INNER JOIN songs_artists ON songs_artists.song_id = views_breakdowns.song_id
    INNER JOIN artists ON artists.id = songs_artists.artist_id
    INNER JOIN songs_artists AS song_co_artists ON song_co_artists.song_id = views_breakdowns.song_id
    INNER JOIN artists AS co_artists ON co_artists.id = song_co_artists.artist_id
    INNER JOIN songs_names ON songs_names.song_id = views_breakdowns.song_id
    WHERE (views_breakdowns.timestamp = CASE WHEN :daysOffset IS NULL
        THEN :timestamp
        ELSE DATE(:timestamp, '-' || :daysOffset || ' day')
        END)
        AND (views_breakdowns.view_type = :viewType OR :viewType IS NULL)
        AND (songs.song_type = :songType OR :songType IS NULL)
        AND (songs.publish_date LIKE :publishDate OR :publishDate IS NULL)
        AND (songs_artists.artist_category = :artistCategory OR :artistCategory IS NULL)
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
                INNER JOIN songs_artists AS song_co_artists ON song_co_artists.song_id = views_breakdowns.song_id
                INNER JOIN artists AS co_artists ON co_artists.id = song_co_artists.artist_id
                INNER JOIN songs_names ON songs_names.song_id = views_breakdowns.song_id
                WHERE (sub_vb.view_type = views_breakdowns.view_type)
                    AND (sub_vb.timestamp = views_breakdowns.timestamp)
                    AND (sub_vb.song_id = views_breakdowns.song_id)
                    AND (songs.song_type = :songType OR :songType IS NULL)
                    AND (songs.publish_date LIKE :publishDate OR :publishDate IS NULL)
                    AND (songs_artists.artist_category = :artistCategory OR :artistCategory IS NULL)
                    AND (artists.artist_type = :artistType OR :artistType IS NULL)
                    AND (songs_names.name LIKE :search OR :search IS NULL)
                    ${filterSongs == '' ? '' : `AND (songs.id IN (${filterSongs}))`}
                    ${filterArtists == '' ? '' : `AND (co_artists.id IN (${filterArtists}))`}
                GROUP BY sub_vb.song_id)
            END)
        ${filterSongs == '' ? '' : `AND (songs.id IN (${filterSongs}))`}
        ${filterArtists == '' ? '' : `AND (co_artists.id IN (${filterArtists}))`}
    GROUP BY 
        CASE WHEN :combineSimilarArtists IS NULL THEN artists.id
        WHEN artists.base_artist_id IS NULL then artists.id
        ELSE (
            WITH RECURSIVE ancestor_path(id, base_artist_id) AS (
                SELECT sub_artists.id, sub_artists.base_artist_id
                FROM artists AS sub_artists
                WHERE id = artists.id
              
                UNION ALL

                SELECT a.id, a.base_artist_id
                FROM artists a
                JOIN ancestor_path ap ON a.id = ap.base_artist_id
              )
            SELECT id
            FROM ancestor_path
            WHERE base_artist_id IS NULL
        )
        END
    HAVING (CASE WHEN :minViews IS NULL
        THEN 1
        ELSE total_views >= :minViews END)
        AND (CASE WHEN :maxViews IS NULL
            THEN 1
            ELSE total_views <= :maxViews 
            END)
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
    OFFSET :startAt`).all(queryParams.params) as RawArtistRankingResult[]
}

function filterArtistsRankingsWithTimePeriodOffsetRawSync(
    queryParams: SqlRankingsFilterParams,
    timePeriodOffset?: number
) {
    const primaryResult = filterArtistRankingsRawSync(queryParams)
    // handle time period offset
    if (timePeriodOffset) {
        const timePeriodOffsetMap: { [key: string]: number } = {}
        queryParams.params.daysOffset = timePeriodOffset + (queryParams.params.daysOffset || 0)
        const offsetResult = filterArtistRankingsRawSync(queryParams)
        for (const data of offsetResult) {
            timePeriodOffsetMap[String(data.artist_id)] = data.total_views
        }

        for (const data of primaryResult) {
            const offsetViews = timePeriodOffsetMap[String(data.artist_id)] || 0
            data.total_views = data.total_views - offsetViews
        }
    }

    return primaryResult
}

function filterArtistRankingsSync(
    filterParams: ArtistRankingsFilterParams = new ArtistRankingsFilterParams()
): ArtistRankingsFilterResult {
    const queryParams = getFilterArtistsQueryParams(filterParams)

    const primaryResult = filterArtistsRankingsWithTimePeriodOffsetRawSync(queryParams, filterParams.timePeriodOffset)
    // handle change offset
    const changeOffset = filterParams.changeOffset
    const changeOffsetMap: { [key: string]: number } = {}
    if (changeOffset && changeOffset > 0) {
        const changeOffsetResult = filterArtistsRankingsWithTimePeriodOffsetRawSync(getFilterArtistsQueryParams(filterParams, changeOffset), filterParams.timePeriodOffset)
        for (let placement = 0; placement < changeOffsetResult.length; placement++) {
            changeOffsetMap[String(changeOffsetResult[placement].artist_id)] = placement
        }
    }

    const returnEntries: ArtistRankingsFilterResultItem[] = []
    // generate rankings entries
    const placementOffset = filterParams.startAt
    let placement = 0
    for (const data of primaryResult) {
        const artistId = data.artist_id
        const previousPlacement = changeOffsetMap[String(artistId)] || placement
        try {
            const artistData = getArtistSync(artistId, false, false)
            if (artistData) {
                returnEntries.push({
                    placement: placement + 1 + placementOffset,
                    change: previousPlacement == placement ? PlacementChange.SAME :
                        (placement > previousPlacement ? PlacementChange.DOWN : PlacementChange.UP),
                    previousPlacement: previousPlacement,
                    views: data.total_views,
                    artist: artistData
                })
            }
            placement++
        } catch (error) { }
    }

    // get entry count
    const entryCount = filterArtistRankingsCountSync(queryParams)

    // build & return ranking result
    return {
        totalCount: entryCount,
        timestamp: queryParams.params.timestamp,
        results: returnEntries
    }
}

export function filterArtistRankings(
    filterParams?: ArtistRankingsFilterParams
): Promise<ArtistRankingsFilterResult> {
    return new Promise((resolve, reject) => {
        try {
            resolve(filterArtistRankingsSync(filterParams))
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

export function getMostRecentViewsTimestamp(): Promise<string | null> {
    return new Promise<string | null>((resolve, reject) => {
        try {
            resolve(getMostRecentViewsTimestampSync())
        } catch (error) {
            reject(error)
        }
    })
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
    placement: ArtistPlacement | null,
    baseArtist: Artist | null
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
        placement,
        views,
        baseArtist,
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

function getArtistPlacementSync(
    artistData: RawArtistData,
    artistViews?: Views | null
): ArtistPlacement | null {
    if (!artistViews) {
        artistViews = getSongViewsSync(artistData.id)
    }
    if (!artistViews) {
        return null
    }

    let allTimePlacement
    // get all time placement
    {
        // get placement
        const allTimePlacementFilterParams = new ArtistRankingsFilterParams()
        allTimePlacementFilterParams.minViews = Number(artistViews.total)
        const category = artistData.artist_type
        allTimePlacementFilterParams.artistCategory = category

        allTimePlacement = filterArtistRankingsCountSync(getFilterArtistsQueryParams(allTimePlacementFilterParams))
    }

    return {
        allTime: allTimePlacement
    }
}

function getArtistSync(
    id: Id,
    getViews: boolean = true,
    getBaseArtist: boolean = true
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
    const placement = views ? getArtistPlacementSync(artistData, views) : null

    const baseArtistId = artistData.base_artist_id

    return buildArtist(
        artistData,
        artistNames,
        artistThumbnails,
        views,
        placement,
        baseArtistId && getBaseArtist ? getArtistSync(baseArtistId, getViews, false) : null
    )
}

export function getArtist(
    id: Id
): Promise<Artist | null> {
    return new Promise<Artist | null>((resolve, reject) => {
        try {
            resolve(getArtistSync(id))
        } catch (error) {
            reject(error)
        }
    })
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
    songPlacement: SongPlacement | null
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
        thumbType,
        songViews,
        songPlacement,
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

function buildSongPlacement(
    allTime: number,
    releaseYear: number
): SongPlacement {
    return {
        allTime: allTime,
        releaseYear: releaseYear
    }
}

function getSongPlacementSync(
    songData: RawSongData,
    songViews?: Views | null
): SongPlacement | null {
    if (!songViews) {
        songViews = getSongViewsSync(songData.id)
    }
    if (!songViews) {
        return null
    }

    let allTimePlacement: number
    // get all time placement
    {
        // get placement
        const allTimePlacementFilterParams = new SongRankingsFilterParams()
        allTimePlacementFilterParams.minViews = Number(songViews.total)

        allTimePlacement = filterSongRankingsCountSync(getSongRankingsFilterQueryParams(allTimePlacementFilterParams))
    }

    // get release year placement
    let releaseYearPlacement: number
    {
        const releaseYear = (new Date(songData.publish_date)).getFullYear() + "%"
        // get placement
        const releaseYearPlacementFilterParams = new SongRankingsFilterParams()
        releaseYearPlacementFilterParams.minViews = Number(songViews.total)
        releaseYearPlacementFilterParams.publishDate = releaseYear

        releaseYearPlacement = filterSongRankingsCountSync(getSongRankingsFilterQueryParams(releaseYearPlacementFilterParams))
    }

    return buildSongPlacement(
        allTimePlacement || 0,
        releaseYearPlacement || 0
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
        const artist = getArtistSync(rawArtist.artist_id, false, false)
        if (artist) {
            artist.category = rawArtist.artist_category as ArtistCategory
            artists.push(artist)
        }
    })
    const songViews = getViews ? getSongViewsSync(songId) : null
    const songPlacement = songViews ? getSongPlacementSync(songData, songViews) : null

    return buildSong(
        songData,
        songNames,
        artists,
        songVideoIds,
        songViews,
        songPlacement
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