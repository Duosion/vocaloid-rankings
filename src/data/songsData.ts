import { getMostVibrantColor } from "@/lib/material/material";
import Niconico from "@/lib/platforms/Niconico";
import bilibili from "@/lib/platforms/bilibili";
import { generateTimestamp } from "@/lib/utils";
import { getVocaDBRecentSongs } from "@/lib/vocadb";
import { Hct, MaterialDynamicColors, SchemeVibrant, argbFromHex, argbFromRgb, hexFromArgb, rgbaFromArgb } from "@material/material-color-utilities";
import type { Statement } from "better-sqlite3";
import { getPaletteFromURL } from "color-thief-node";
import getDatabase, { Databases } from ".";
import { Artist, ArtistCategory, ArtistPlacement, ArtistRankingsFilterParams, ArtistRankingsFilterResult, ArtistRankingsFilterResultItem, ArtistThumbnailType, ArtistThumbnails, ArtistType, FilterInclusionMode, HistoricalViews, HistoricalViewsResult, Id, NameType, Names, PlacementChange, RawArtistData, RawArtistName, RawArtistRankingResult, RawArtistThumbnail, RawSongArtist, RawSongData, RawSongName, RawSongRankingsResult, RawSongVideoId, RawViewBreakdown, Song, SongArtistsCategories, SongPlacement, SongRankingsFilterParams, SongRankingsFilterResult, SongRankingsFilterResultItem, SongType, SongVideoIds, SourceType, SqlRankingsFilterInVariables, SqlRankingsFilterParams, SqlRankingsFilterStatements, SqlSearchArtistsFilterParams, User, UserAccessLevel, Views, ViewsBreakdown } from "./types";
import YouTube from "@/lib/platforms/YouTube";

// import database
const db = getDatabase(Databases.SONGS_DATA)

const buildSongRankingsFilterStatements = (
    filterParams: SongRankingsFilterParams,
    variables: SqlRankingsFilterInVariables
): SqlRankingsFilterStatements => {
    const statements: SqlRankingsFilterStatements = {}

    // import variables
    const includeArtistsVariables = variables.includeArtists
    const excludeArtistsVariables = variables.excludeArtists
    const includeSongsVariables = variables.includeSongs
    const excludeSongsVariables = variables.excludeSongs
    const includeSourceTypesVariables = variables.includeSourceTypes
    const excludeSourceTypesVariables = variables.excludeSourceTypes
    const includeSongTypesVariables = variables.includeSongTypes
    const excludeSongTypesVariables = variables.excludeSongTypes
    const includeArtistTypesVariables = variables.includeArtistTypes
    const excludeArtistTypesVariables = variables.excludeArtistTypes

    // build include/exclude artists statements
    statements.includeArtists = includeArtistsVariables ?
        filterParams.includeArtistsMode == FilterInclusionMode.OR ? ` AND (songs_artists.artist_id IN (${includeArtistsVariables.join(',')}))`
            : ` AND (
                ${includeArtistsVariables.map(varName => `
                EXISTS (
                    WITH RECURSIVE descendants AS (
                        SELECT id FROM artists WHERE id = ${varName}
                        UNION ALL
                        SELECT a.id FROM artists a
                        INNER JOIN descendants d ON a.base_artist_id = d.id
                    )
                    SELECT 1 FROM songs_artists sa 
                    WHERE sa.song_id = views_breakdowns.song_id 
                        AND (sa.artist_id = ${varName}
                            OR :includeSimilarArtists IS NOT NULL AND sa.artist_id IN descendants
                            )
                    )`).join(' AND ')}
            )`
        : ''
    statements.excludeArtists = excludeArtistsVariables ?
        filterParams.excludeArtistsMode == FilterInclusionMode.OR ? `AND ( ${excludeArtistsVariables.map(varName => `NOT EXISTS ( SELECT 1 FROM songs_artists sa WHERE sa.song_id = views_breakdowns.song_id AND sa.artist_id = ${varName} )`).join(' AND ')} )`
            : ` AND (
                    ${excludeArtistsVariables.map(varName => `
                    NOT EXISTS (
                        WITH RECURSIVE descendants AS (
                            SELECT id FROM artists WHERE id = ${varName}
                            UNION ALL
                            SELECT a.id FROM artists a
                            INNER JOIN descendants d ON a.base_artist_id = d.id
                        )
                        SELECT 1 FROM songs_artists sa 
                        WHERE sa.song_id = views_breakdowns.song_id 
                        AND (sa.artist_id = ${varName}
                            OR :includeSimilarArtists IS NOT NULL AND sa.artist_id IN descendants
                            )
                        )`).join(' OR ')}
                )`
        : ''

    // build include/exclude songs statements
    statements.includeSongs = includeSongsVariables ? ` AND (songs.id IN (${includeSongsVariables.join(', ')}))` : ''
    statements.excludeSongs = excludeSongsVariables ? ` AND (songs.id NOT IN (${excludeSongsVariables.join(', ')}))` : ''

    // build include/exclude source types statements
    {
        const includeSourceTypesVariablesJoined = includeSourceTypesVariables ? includeSourceTypesVariables.join(', ') : null
        const excludeSourceTypesVariablesJoined = excludeSourceTypesVariables ? excludeSourceTypesVariables.join(', ') : null

        statements.includeSourceTypes = includeSourceTypesVariablesJoined ? ` AND (views_breakdowns.view_type IN (${includeSourceTypesVariablesJoined}))` : ''
        statements.excludeSourceTypes = excludeSourceTypesVariablesJoined ? ` AND (views_breakdowns.view_type IN (${excludeSourceTypesVariablesJoined}))` : ''
        statements.offsetIncludeSourceTypes = includeSourceTypesVariablesJoined ? ` AND (offset_breakdowns.view_type IN (${includeSourceTypesVariablesJoined}))` : ''
        statements.offsetExcludeSourceTypes = excludeSourceTypesVariablesJoined ? ` AND (offset_breakdowns.view_type NOT IN (${excludeSourceTypesVariablesJoined}))` : ''
        statements.subOffsetIncludeSourceTypes = includeSourceTypesVariablesJoined ? ` AND (sub_vb.view_type IN (${includeSourceTypesVariablesJoined}))` : ''
        statements.subOffsetExcludeSourceTypes = excludeSourceTypesVariablesJoined ? ` AND (sub_vb.view_type NOT IN (${excludeSourceTypesVariablesJoined}))` : ''
    }

    // build include/exclude song types statements
    statements.includeSongTypes = includeSongTypesVariables ? ` AND (songs.song_type IN (${includeSongTypesVariables.join(', ')}))` : ''
    statements.excludeSongTypes = excludeSongTypesVariables ? ` AND (songs.song_type NOT IN (${excludeSongTypesVariables.join(', ')}))` : ''

    // build include/exclude artist types statements
    statements.includeArtistTypes = includeArtistTypesVariables ?
        filterParams.includeArtistTypesMode == FilterInclusionMode.OR ? ` AND EXISTS (
            SELECT 1 
            FROM artists 
            INNER JOIN songs_artists sa ON sa.artist_id = artists.id 
            WHERE sa.song_id = views_breakdowns.song_id 
            AND artists.artist_type IN (${includeArtistTypesVariables.join(', ')})
        )`
            : ` AND ( ${includeArtistTypesVariables.map(varName => `EXISTS (
                SELECT 1 
                FROM artists 
                INNER JOIN songs_artists sa ON sa.artist_id = artists.id 
                WHERE sa.song_id = views_breakdowns.song_id 
                AND artists.artist_type = ${varName}
            )`).join(' AND ')})`
        : ''
    statements.excludeArtistTypes = excludeArtistTypesVariables ?
        filterParams.excludeArtistTypesMode == FilterInclusionMode.OR ? ` AND NOT EXISTS (
            SELECT 1 
            FROM artists 
            INNER JOIN songs_artists sa ON sa.artist_id = artists.id 
            WHERE sa.song_id = views_breakdowns.song_id 
            AND artists.artist_type IN (${excludeArtistTypesVariables.join(', ')})
        )`
            : ` AND ( ${excludeArtistTypesVariables.map(varName => `NOT EXISTS (
                SELECT 1 
                FROM artists 
                INNER JOIN songs_artists sa ON sa.artist_id = artists.id 
                WHERE sa.song_id = views_breakdowns.song_id 
                AND artists.artist_type = ${varName}
            )`).join(' OR ')})`
        : ''

    return statements
}

// rankings
function getSongRankingsFilterQueryParams(
    filterParams: SongRankingsFilterParams,
    daysOffset?: number
): SqlRankingsFilterParams {
    // merge the filter params with the defaults
    const queryParams: { [key: string]: any } = {
        timestamp: getMostRecentViewsTimestampSync(filterParams.timestamp),
        timePeriodOffset: filterParams.timePeriodOffset,
        daysOffset: daysOffset == null ? filterParams.daysOffset : daysOffset + (filterParams.daysOffset || 0),
        publishDate: filterParams.publishDate || null,
        orderBy: filterParams.orderBy,
        direction: filterParams.direction,
        singleVideo: filterParams.singleVideo ? 1 : null,
        includeSimilarArtists: filterParams.includeSimilarArtists ? 1 : null,
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
        return stringBuilder
    }

    // prepare build statements
    // artists
    const filterParamsIncludeArtists = filterParams.includeArtists
    const filterParamsExcludeArtists = filterParams.excludeArtists
    // songs
    const filterParamsIncludeSongs = filterParams.includeSongs
    const filterParamsExcludeSongs = filterParams.excludeSongs
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
        statements: buildSongRankingsFilterStatements(filterParams, {
            includeArtists: filterParamsIncludeArtists && buildInStatement(filterParamsIncludeArtists, 'includeArtist'),
            excludeArtists: filterParamsExcludeArtists && buildInStatement(filterParamsExcludeArtists, 'excludeArtist'),
            includeSongs: filterParamsIncludeSongs && buildInStatement(filterParamsIncludeSongs, 'song'),
            excludeSongs: filterParamsExcludeSongs && buildInStatement(filterParamsExcludeSongs, 'song'),
            includeSourceTypes: filterParamsIncludeSourceTypes && buildInStatement(filterParamsIncludeSourceTypes, 'includeSourceTypes'),
            excludeSourceTypes: filterParamsExcludeSourceTypes && buildInStatement(filterParamsExcludeSourceTypes, 'excludeSourceTypes'),
            includeSongTypes: filterParamsIncludeSongTypes && buildInStatement(filterParamsIncludeSongTypes, 'includeSongTypes'),
            excludeSongTypes: filterParamsExcludeSongTypes && buildInStatement(filterParamsExcludeSongTypes, 'excludeSongTypes'),
            includeArtistTypes: filterParamsIncludeArtistTypes && buildInStatement(filterParamsIncludeArtistTypes, 'includeArtistTypes'),
            excludeArtistTypes: filterParamsExcludeArtistTypes && buildInStatement(filterParamsExcludeArtistTypes, 'excludeArtistTypes'),
        }),
        params: queryParams
    }
}

function filterSongRankingsRawSync(
    queryParams: SqlRankingsFilterParams
): RawSongRankingsResult[] {
    const statements = queryParams.statements
    // load statements into memory
    const filterIncludeArtistsStatement = statements.includeArtists || ''
    const filterExcludeArtistsStatement = statements.excludeArtists || ''
    const filterIncludeSongsStatement = statements.includeSongs || ''
    const filterExcludeSongsStatement = statements.excludeSongs || ''
    const filterIncludeSourceTypesStatement = statements.includeSourceTypes || ''
    const filterExcludeSourceTypesStatement = statements.excludeSourceTypes || ''
    const filterOffsetIncludeSourceTypesStatement = statements.offsetIncludeSourceTypes || ''
    const filterOffsetExcludeSourceTypesStatement = statements.offsetExcludeSourceTypes || ''
    const filterOffsetSubIncludeSourceTypesStatement = statements.subOffsetIncludeSourceTypes || ''
    const filterOffsetSubExcludeSourceTypesStatement = statements.subOffsetExcludeSourceTypes || ''
    const filterIncludeSongTypesStatement = statements.includeSongTypes || ''
    const filterExcludeSongTypesStatement = statements.excludeSongTypes || ''
    const filterIncludeArtistTypesStatement = statements.includeArtistTypes || ''
    const filterExcludeArtistTypesStatement = statements.excludeArtistTypes || ''

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
                                    (SELECT MAX(sub_vb.views)
                                    FROM views_breakdowns AS sub_vb 
                                    INNER JOIN songs ON songs.id = sub_vb.song_id
                                    INNER JOIN songs_artists ON songs_artists.song_id = sub_vb.song_id
                                    INNER JOIN artists ON artists.id = songs_artists.artist_id
                                    WHERE (sub_vb.view_type = offset_breakdowns.view_type)
                                        AND (sub_vb.timestamp = offset_breakdowns.timestamp)
                                        AND (sub_vb.song_id = offset_breakdowns.song_id)
                                        AND (songs.publish_date LIKE :publishDate OR :publishDate IS NULL)${filterOffsetSubIncludeSourceTypesStatement}${filterOffsetSubExcludeSourceTypesStatement}${filterIncludeSongTypesStatement}${filterExcludeSongTypesStatement}${filterIncludeArtistTypesStatement}${filterExcludeArtistTypesStatement}${filterIncludeArtistsStatement}${filterExcludeArtistsStatement}${filterIncludeSongsStatement}${filterExcludeSongsStatement}
                                    )
                                END)${filterOffsetIncludeSourceTypesStatement}${filterOffsetExcludeSourceTypesStatement}${filterIncludeSongTypesStatement}${filterExcludeSongTypesStatement}${filterIncludeArtistTypesStatement}${filterExcludeArtistTypesStatement}${filterIncludeArtistsStatement}${filterExcludeArtistsStatement}${filterIncludeSongsStatement}${filterExcludeSongsStatement}
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
                                    (SELECT MAX(sub_vb.views)
                                    FROM views_breakdowns AS sub_vb 
                                    INNER JOIN songs ON songs.id = sub_vb.song_id
                                    INNER JOIN songs_artists ON songs_artists.song_id = sub_vb.song_id
                                    INNER JOIN artists ON artists.id = songs_artists.artist_id
                                    WHERE (sub_vb.view_type = offset_breakdowns.view_type)
                                        AND (sub_vb.timestamp = offset_breakdowns.timestamp)
                                        AND (sub_vb.song_id = offset_breakdowns.song_id)
                                        AND (songs.publish_date LIKE :publishDate OR :publishDate IS NULL)${filterOffsetSubIncludeSourceTypesStatement}${filterOffsetSubExcludeSourceTypesStatement}${filterIncludeSongTypesStatement}${filterExcludeSongTypesStatement}${filterIncludeArtistTypesStatement}${filterExcludeArtistTypesStatement}${filterIncludeArtistsStatement}${filterExcludeArtistsStatement}${filterIncludeSongsStatement}${filterExcludeSongsStatement}
                                    )
                                END)${filterOffsetIncludeSourceTypesStatement}${filterOffsetExcludeSourceTypesStatement}${filterIncludeSongTypesStatement}${filterExcludeSongTypesStatement}${filterIncludeArtistTypesStatement}${filterExcludeArtistTypesStatement}${filterIncludeArtistsStatement}${filterExcludeArtistsStatement}${filterIncludeSongsStatement}${filterExcludeSongsStatement}
                        GROUP BY offset_breakdowns.song_id
                        ) END)
                END) /  MAX(MIN(julianday('now') - julianday(songs.publish_date), 730), 1)
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
                                    (SELECT MAX(sub_vb.views)
                                    FROM views_breakdowns AS sub_vb 
                                    INNER JOIN songs ON songs.id = sub_vb.song_id
                                    INNER JOIN songs_artists ON songs_artists.song_id = sub_vb.song_id
                                    INNER JOIN artists ON artists.id = songs_artists.artist_id
                                    WHERE (sub_vb.view_type = offset_breakdowns.view_type)
                                        AND (sub_vb.timestamp = offset_breakdowns.timestamp)
                                        AND (sub_vb.song_id = offset_breakdowns.song_id)
                                        AND (songs.publish_date LIKE :publishDate OR :publishDate IS NULL)${filterOffsetSubIncludeSourceTypesStatement}${filterOffsetSubExcludeSourceTypesStatement}${filterIncludeSongTypesStatement}${filterExcludeSongTypesStatement}${filterIncludeArtistTypesStatement}${filterExcludeArtistTypesStatement}${filterIncludeArtistsStatement}${filterExcludeArtistsStatement}${filterIncludeSongsStatement}${filterExcludeSongsStatement}
                                    )
                                END)${filterOffsetIncludeSourceTypesStatement}${filterOffsetExcludeSourceTypesStatement}${filterIncludeSongTypesStatement}${filterExcludeSongTypesStatement}${filterIncludeArtistTypesStatement}${filterExcludeArtistTypesStatement}${filterIncludeArtistsStatement}${filterExcludeArtistsStatement}${filterIncludeSongsStatement}${filterExcludeSongsStatement}
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
                                    (SELECT MAX(sub_vb.views)
                                    FROM views_breakdowns AS sub_vb 
                                    INNER JOIN songs ON songs.id = sub_vb.song_id
                                    INNER JOIN songs_artists ON songs_artists.song_id = sub_vb.song_id
                                    INNER JOIN artists ON artists.id = songs_artists.artist_id
                                    WHERE (sub_vb.view_type = offset_breakdowns.view_type)
                                        AND (sub_vb.timestamp = offset_breakdowns.timestamp)
                                        AND (sub_vb.song_id = offset_breakdowns.song_id)
                                        AND (songs.publish_date LIKE :publishDate OR :publishDate IS NULL)${filterOffsetSubIncludeSourceTypesStatement}${filterOffsetSubExcludeSourceTypesStatement}${filterIncludeSongTypesStatement}${filterExcludeSongTypesStatement}${filterIncludeArtistTypesStatement}${filterExcludeArtistTypesStatement}${filterIncludeArtistsStatement}${filterExcludeArtistsStatement}${filterIncludeSongsStatement}${filterExcludeSongsStatement}
                                    )
                                END)${filterOffsetIncludeSourceTypesStatement}${filterOffsetExcludeSourceTypesStatement}${filterIncludeSongTypesStatement}${filterExcludeSongTypesStatement}${filterIncludeArtistTypesStatement}${filterExcludeArtistTypesStatement}${filterIncludeArtistsStatement}${filterExcludeArtistsStatement}${filterIncludeSongsStatement}${filterExcludeSongsStatement}
                        GROUP BY offset_breakdowns.song_id
                        ) END)
                END 
            END AS total_views,
            COUNT(*) OVER() as total_count
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
                    (SELECT MAX(sub_vb.views)
                    FROM views_breakdowns AS sub_vb 
                    INNER JOIN songs ON songs.id = sub_vb.song_id
                    INNER JOIN songs_artists ON songs_artists.song_id = sub_vb.song_id
                    INNER JOIN artists ON artists.id = songs_artists.artist_id
                    WHERE (sub_vb.view_type = views_breakdowns.view_type)
                        AND (sub_vb.timestamp = views_breakdowns.timestamp)
                        AND (sub_vb.song_id = views_breakdowns.song_id)
                        AND (songs.publish_date LIKE :publishDate OR :publishDate IS NULL)${filterOffsetSubIncludeSourceTypesStatement}${filterOffsetSubExcludeSourceTypesStatement}${filterIncludeSongTypesStatement}${filterExcludeSongTypesStatement}${filterIncludeArtistTypesStatement}${filterExcludeArtistTypesStatement}${filterIncludeArtistsStatement}${filterExcludeArtistsStatement}${filterIncludeSongsStatement}${filterExcludeSongsStatement}
                    )
                END)${filterIncludeSourceTypesStatement}${filterExcludeSourceTypesStatement}${filterIncludeSongTypesStatement}${filterExcludeSongTypesStatement}${filterIncludeArtistTypesStatement}${filterExcludeArtistTypesStatement}${filterIncludeArtistsStatement}${filterExcludeArtistsStatement}${filterIncludeSongsStatement}${filterExcludeSongsStatement}
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

    return {
        totalCount: primaryResult[0]?.total_count,
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
const buildArtistRankingsFilterStatements = (
    filterParams: ArtistRankingsFilterParams,
    variables: SqlRankingsFilterInVariables
): SqlRankingsFilterStatements => {
    const statements: SqlRankingsFilterStatements = {}

    // import variables
    const includeArtistsVariables = variables.includeArtists
    const excludeArtistsVariables = variables.excludeArtists
    const includeSongsVariables = variables.includeSongs
    const excludeSongsVariables = variables.excludeSongs
    const includeSourceTypesVariables = variables.includeSourceTypes
    const excludeSourceTypesVariables = variables.excludeSourceTypes
    const includeSongTypesVariables = variables.includeSongTypes
    const excludeSongTypesVariables = variables.excludeSongTypes
    const includeArtistTypesVariables = variables.includeArtistTypes
    const excludeArtistTypesVariables = variables.excludeArtistTypes
    const includeCoArtistsOfVariables = variables.includeCoArtistsOf

    // build include/exclude artists statements
    statements.includeArtists = includeArtistsVariables ? `AND (songs_artists.artist_id IN (${includeArtistsVariables.join(',')}))` : ''
    statements.excludeArtists = excludeArtistsVariables ? `AND ( ${excludeArtistsVariables.map(varName => `NOT EXISTS ( SELECT 1 FROM songs_artists sa WHERE sa.song_id = views_breakdowns.song_id AND sa.artist_id = ${varName} )`).join(' AND ')} )` : ''

    // build include/exclude songs statements
    statements.includeSongs = includeSongsVariables ? ` AND (songs.id IN (${includeSongsVariables.join(', ')}))` : ''
    statements.excludeSongs = excludeSongsVariables ? ` AND (songs.id NOT IN (${excludeSongsVariables.join(', ')}))` : ''

    // build include/exclude source types statements
    {
        const includeSourceTypesVariablesJoined = includeSourceTypesVariables ? includeSourceTypesVariables.join(', ') : null
        const excludeSourceTypesVariablesJoined = excludeSourceTypesVariables ? excludeSourceTypesVariables.join(', ') : null

        statements.includeSourceTypes = includeSourceTypesVariablesJoined ? ` AND (views_breakdowns.view_type IN (${includeSourceTypesVariablesJoined}))` : ''
        statements.excludeSourceTypes = excludeSourceTypesVariablesJoined ? ` AND (views_breakdowns.view_type NOT IN (${excludeSourceTypesVariablesJoined}))` : ''
        statements.offsetIncludeSourceTypes = includeSourceTypesVariablesJoined ? ` AND (offset_breakdowns.view_type IN (${includeSourceTypesVariablesJoined}))` : ''
        statements.offsetExcludeSourceTypes = excludeSourceTypesVariablesJoined ? ` AND (offset_breakdowns.view_type NOT IN (${excludeSourceTypesVariablesJoined}))` : ''
        statements.subOffsetIncludeSourceTypes = includeSourceTypesVariablesJoined ? ` AND (sub_vb.view_type IN (${includeSourceTypesVariablesJoined}))` : ''
        statements.subOffsetExcludeSourceTypes = excludeSourceTypesVariablesJoined ? ` AND (sub_vb.view_type NOT IN (${excludeSourceTypesVariablesJoined}))` : ''
    }

    // build include/exclude song types statements
    statements.includeSongTypes = includeSongTypesVariables ? ` AND (songs.song_type IN (${includeSongTypesVariables.join(', ')}))` : ''
    statements.excludeSongTypes = excludeSongTypesVariables ? ` AND (songs.song_type NOT IN (${excludeSongTypesVariables.join(', ')}))` : ''

    // build include/exclude artist types statements
    {
        const includeArtistTypesVariablesJoined = includeArtistTypesVariables ? includeArtistTypesVariables.join(', ') : null
        const excludeArtistTypesVariablesJoined = excludeArtistTypesVariables ? excludeArtistTypesVariables.join(', ') : null

        statements.includeArtistTypes = includeArtistTypesVariablesJoined ? ` AND artists.artist_type IN (${includeArtistTypesVariablesJoined})` : ''
        statements.ancestorIncludeArtistTypes = includeArtistTypesVariablesJoined ? ` WHERE artists.artist_type IN (${includeArtistTypesVariablesJoined})` : ''

        statements.excludeArtistTypes = excludeArtistTypesVariablesJoined ? ` AND artists.artist_type NOT IN (${excludeArtistTypesVariablesJoined})` : ''
        statements.ancestorExcludeArtistTypes = excludeArtistTypesVariablesJoined ? `${statements.ancestorIncludeArtistTypes ? ' AND' : ' WHERE'} artists.artist_type NOT IN (${excludeArtistTypesVariablesJoined})` : ''
    }

    // build include coArtistsOf statements
    {
        const joined = includeCoArtistsOfVariables && includeCoArtistsOfVariables.join(',')
        statements.includeCoArtistsOf = joined ? `AND (base_songs_artists.artist_id IN (${joined})) AND artists.id NOT IN (${joined})` : ''
    }


    return statements
}

function getArtistRankingsFilterQueryParams(
    filterParams: ArtistRankingsFilterParams,
    daysOffset?: number
): SqlRankingsFilterParams {
    // merge the filter params with the defaults
    const queryParams: { [key: string]: any } = {
        timestamp: getMostRecentViewsTimestampSync(filterParams.timestamp),
        timePeriodOffset: filterParams.timePeriodOffset,
        daysOffset: daysOffset == null ? filterParams.daysOffset : daysOffset + (filterParams.daysOffset || 0),
        artistCategory: filterParams.artistCategory,
        songPublishDate: filterParams.songPublishDate || null,
        publishDate: filterParams.publishDate || null,
        orderBy: filterParams.orderBy,
        direction: filterParams.direction,
        singleVideo: filterParams.singleVideo ? 1 : null,
        combineSimilarArtists: filterParams.combineSimilarArtists ? 1 : null,
        maxEntries: filterParams.maxEntries,
        startAt: filterParams.startAt,
        minViews: filterParams.minViews,
        maxViews: filterParams.maxViews,
        search: filterParams.search?.toLowerCase(),
        includeCoArtistsOf: filterParams.includeCoArtistsOf ? 1 : null,
        parentArtistId: filterParams.parentArtistId || null
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
        return stringBuilder
    }

    // prepare build statements
    const filterParamsIncludeArtists = filterParams.includeArtists
    const filterParamsExcludeArtists = filterParams.excludeArtists

    // songs
    const filterParamsIncludeSongs = filterParams.includeSongs
    const filterParamsExcludeSongs = filterParams.excludeSongs

    // source types
    const filterParamsIncludeSourceTypes = filterParams.includeSourceTypes
    const filterParamsExcludeSourceTypes = filterParams.excludeSourceTypes

    // song types
    const filterParamsIncludeSongTypes = filterParams.includeSongTypes
    const filterParamsExcludeSongTypes = filterParams.excludeSongTypes

    // artist types
    const filterParamsIncludeArtistTypes = filterParams.includeArtistTypes
    const filterParamsExcludeArtistTypes = filterParams.excludeArtistTypes

    // include co artists of
    const filterParamsIncludeCoArtistsOf = filterParams.includeCoArtistsOf

    return {
        statements: buildArtistRankingsFilterStatements(filterParams, {
            includeArtists: filterParamsIncludeArtists && buildInStatement(filterParamsIncludeArtists, 'includeArtist'),
            excludeArtists: filterParamsExcludeArtists && buildInStatement(filterParamsExcludeArtists, 'excludeArtist'),
            includeSongs: filterParamsIncludeSongs && buildInStatement(filterParamsIncludeSongs, 'song'),
            excludeSongs: filterParamsExcludeSongs && buildInStatement(filterParamsExcludeSongs, 'song'),
            includeSourceTypes: filterParamsIncludeSourceTypes && buildInStatement(filterParamsIncludeSourceTypes, 'includeSourceTypes'),
            excludeSourceTypes: filterParamsExcludeSourceTypes && buildInStatement(filterParamsExcludeSourceTypes, 'excludeSourceTypes'),
            includeSongTypes: filterParamsIncludeSongTypes && buildInStatement(filterParamsIncludeSongTypes, 'includeSongTypes'),
            excludeSongTypes: filterParamsExcludeSongTypes && buildInStatement(filterParamsExcludeSongTypes, 'excludeSongTypes'),
            includeArtistTypes: filterParamsIncludeArtistTypes && buildInStatement(filterParamsIncludeArtistTypes, 'includeArtistTypes'),
            excludeArtistTypes: filterParamsExcludeArtistTypes && buildInStatement(filterParamsExcludeArtistTypes, 'excludeArtistTypes'),
            includeCoArtistsOf: filterParamsIncludeCoArtistsOf && buildInStatement(filterParamsIncludeCoArtistsOf, 'includeCoArtistsOf')
        }),
        params: queryParams
    }
}

function filterArtistRankingsRawSync(
    queryParams: SqlRankingsFilterParams
): RawArtistRankingResult[] {
    const statements = queryParams.statements
    // load statements into memory
    const filterIncludeArtistsStatement = statements.includeArtists || ''
    const filterExcludeArtistsStatement = statements.excludeArtists || ''
    const filterIncludeSongsStatement = statements.includeSongs || ''
    const filterExcludeSongsStatement = statements.excludeSongs || ''
    const filterIncludeSourceTypesStatement = statements.includeSourceTypes || ''
    const filterExcludeSourceTypesStatement = statements.excludeSourceTypes || ''
    const filterOffsetSubIncludeSourceTypesStatement = statements.subOffsetIncludeSourceTypes || ''
    const filterOffsetSubExcludeSourceTypesStatement = statements.subOffsetExcludeSourceTypes || ''
    const filterIncludeSongTypesStatement = statements.includeSongTypes || ''
    const filterExcludeSongTypesStatement = statements.excludeSongTypes || ''
    const filterIncludeArtistTypesStatement = statements.includeArtistTypes || ''
    const filterExcludeArtistTypesStatement = statements.excludeArtistTypes || ''
    const filterIncludeCoArtistsOfStatement = statements.includeCoArtistsOf || ''

    return db.prepare(`
    WITH RECURSIVE artist_hierarchy AS (
        SELECT id, base_artist_id, id AS root_artist_id
        FROM artists
        WHERE base_artist_id IS NULL
    
        UNION ALL
    
        SELECT artists.id, artists.base_artist_id, artist_hierarchy.root_artist_id
        FROM artists
        JOIN artist_hierarchy ON artists.base_artist_id = artist_hierarchy.id
    ),
    no_period_offset AS (
        SELECT 
            (CASE WHEN :combineSimilarArtists IS NULL THEN artists.id
                WHEN artists.base_artist_id IS NULL THEN artists.id
                ELSE artist_hierarchy.root_artist_id
            END) AS artist_id,
            (CASE WHEN :orderBy = 4 THEN COUNT(DISTINCT songs.id) ELSE SUM(views_breakdowns.views) END) AS views 
        FROM views_breakdowns
        INNER JOIN songs_artists ON songs_artists.song_id = views_breakdowns.song_id
        INNER JOIN songs ON songs.id = songs_artists.song_id
        INNER JOIN artists ON artists.id = songs_artists.artist_id
        INNER JOIN artist_hierarchy ON songs_artists.artist_id = artist_hierarchy.id
        WHERE (views_breakdowns.timestamp = CASE WHEN :daysOffset IS NULL
            THEN :timestamp
            ELSE DATE(:timestamp, '-' || :daysOffset || ' day')
        END)
        AND (:songPublishDate IS NULL OR songs.publish_date LIKE :songPublishDate)
        AND (:publishDate IS NULL OR artists.publish_date LIKE :publishDate)
        AND (songs_artists.artist_category = :artistCategory OR :artistCategory IS NULL)
        AND (:parentArtistId IS NULL or artists.base_artist_id = :parentArtistId)
        AND (:search IS NULL OR EXISTS (
            SELECT artists_names.artist_id 
            FROM artists_names 
            WHERE (artists_names.artist_id = songs_artists.artist_id) 
                AND (artists_names.name LIKE :search)
            LIMIT 1
            ))
        AND (views_breakdowns.views = CASE WHEN :singleVideo IS NULL
            THEN views_breakdowns.views
            ELSE
                (SELECT MAX(sub_vb.views)
                FROM views_breakdowns AS sub_vb 
                INNER JOIN songs ON songs.id = sub_vb.song_id
                INNER JOIN songs_artists ON songs_artists.song_id = sub_vb.song_id
                INNER JOIN artists ON artists.id = songs_artists.artist_id
                INNER JOIN artists_names ON artists_names.artist_id = artists.id
                WHERE (sub_vb.view_type = views_breakdowns.view_type)
                    AND (sub_vb.timestamp = views_breakdowns.timestamp)
                    AND (sub_vb.song_id = views_breakdowns.song_id)
                    AND (:songPublishDate IS NULL OR songs.publish_date LIKE :songPublishDate)
                    AND (:publishDate IS NULL OR artists.publish_date LIKE :publishDate)
                    AND (:parentArtistId IS NULL or artists.base_artist_id = :parentArtistId)
                    AND (songs_artists.artist_category = :artistCategory OR :artistCategory IS NULL)
                    AND (artists_names.name LIKE :search OR :search IS NULL)${filterOffsetSubIncludeSourceTypesStatement}${filterOffsetSubExcludeSourceTypesStatement}${filterIncludeSongTypesStatement}${filterExcludeSongTypesStatement}${filterIncludeArtistTypesStatement}${filterExcludeArtistTypesStatement}${filterIncludeArtistsStatement}${filterExcludeArtistsStatement}${filterIncludeSongsStatement}${filterExcludeSongsStatement}
                GROUP BY sub_vb.song_id)
            END)${filterIncludeSourceTypesStatement}${filterExcludeSourceTypesStatement}${filterIncludeSongTypesStatement}${filterExcludeSongTypesStatement}${filterIncludeArtistTypesStatement}${filterExcludeArtistTypesStatement}${filterIncludeArtistsStatement}${filterExcludeArtistsStatement}${filterIncludeSongsStatement}${filterExcludeSongsStatement}
        GROUP BY (CASE WHEN :combineSimilarArtists IS NULL THEN artists.id
                WHEN artists.base_artist_id IS NULL then artists.id
                ELSE artist_hierarchy.root_artist_id
            END)
    ),
    no_period_offset_co_artists AS (
        SELECT 
            (CASE WHEN :combineSimilarArtists IS NULL THEN artists.id
                WHEN artists.base_artist_id IS NULL THEN artists.id
                ELSE artist_hierarchy.root_artist_id
            END) AS artist_id,
            (CASE WHEN :orderBy = 4 THEN COUNT(DISTINCT songs.id) ELSE SUM(views_breakdowns.views) END) AS views 
        FROM views_breakdowns
        INNER JOIN songs_artists AS base_songs_artists ON songs_artists.song_id = views_breakdowns.song_id
        INNER JOIN songs ON songs.id = songs_artists.song_id
        INNER JOIN songs_artists ON base_songs_artists.song_id = songs.id
        INNER JOIN artists ON artists.id = songs_artists.artist_id
        INNER JOIN artist_hierarchy ON songs_artists.artist_id = artist_hierarchy.id
        WHERE (views_breakdowns.timestamp = CASE WHEN :daysOffset IS NULL
            THEN :timestamp
            ELSE DATE(:timestamp, '-' || :daysOffset || ' day')
        END)
        AND (:songPublishDate IS NULL OR songs.publish_date LIKE :songPublishDate)
        AND (:publishDate IS NULL OR artists.publish_date LIKE :publishDate)
        AND (songs_artists.artist_category = :artistCategory OR :artistCategory IS NULL)
        AND (:parentArtistId IS NULL or artists.base_artist_id = :parentArtistId)
        AND (:search IS NULL OR EXISTS (
            SELECT artists_names.artist_id 
            FROM artists_names 
            WHERE (artists_names.artist_id = songs_artists.artist_id) 
                AND (artists_names.name LIKE :search)
            LIMIT 1
            ))
        AND (views_breakdowns.views = CASE WHEN :singleVideo IS NULL
            THEN views_breakdowns.views
            ELSE
                (SELECT MAX(sub_vb.views)
                FROM views_breakdowns AS sub_vb 
                INNER JOIN songs ON songs.id = sub_vb.song_id
                INNER JOIN songs_artists ON songs_artists.song_id = sub_vb.song_id
                INNER JOIN artists ON artists.id = songs_artists.artist_id
                INNER JOIN artists_names ON artists_names.artist_id = artists.id
                WHERE (sub_vb.view_type = views_breakdowns.view_type)
                    AND (sub_vb.timestamp = views_breakdowns.timestamp)
                    AND (sub_vb.song_id = views_breakdowns.song_id)
                    AND (:songPublishDate IS NULL OR songs.publish_date LIKE :songPublishDate)
                    AND (:publishDate IS NULL OR artists.publish_date LIKE :publishDate)
                    AND (songs_artists.artist_category = :artistCategory OR :artistCategory IS NULL)
                    AND (:parentArtistId IS NULL or artists.base_artist_id = :parentArtistId)
                    AND (artists_names.name LIKE :search OR :search IS NULL)${filterOffsetSubIncludeSourceTypesStatement}${filterOffsetSubExcludeSourceTypesStatement}${filterIncludeSongTypesStatement}${filterExcludeSongTypesStatement}${filterIncludeArtistTypesStatement}${filterExcludeArtistTypesStatement}${filterIncludeArtistsStatement}${filterExcludeArtistsStatement}${filterIncludeSongsStatement}${filterExcludeSongsStatement}${filterIncludeCoArtistsOfStatement}
                GROUP BY sub_vb.song_id)
            END)${filterIncludeSourceTypesStatement}${filterExcludeSourceTypesStatement}${filterIncludeSongTypesStatement}${filterExcludeSongTypesStatement}${filterIncludeArtistTypesStatement}${filterExcludeArtistTypesStatement}${filterIncludeArtistsStatement}${filterExcludeArtistsStatement}${filterIncludeSongsStatement}${filterExcludeSongsStatement}${filterIncludeCoArtistsOfStatement}
        GROUP BY (CASE WHEN :combineSimilarArtists IS NULL THEN artists.id
                WHEN artists.base_artist_id IS NULL then artists.id
                ELSE artist_hierarchy.root_artist_id
            END)
    ),
    period_offset AS (
        SELECT 
            (CASE WHEN :combineSimilarArtists IS NULL THEN artists.id
                WHEN artists.base_artist_id IS NULL then artists.id
                ELSE artist_hierarchy.root_artist_id
            END) AS artist_id,
            (CASE WHEN :orderBy = 4 THEN COUNT(DISTINCT songs.id) ELSE SUM(views_breakdowns.views) END) AS views 
        FROM views_breakdowns
        INNER JOIN songs_artists ON songs_artists.song_id = views_breakdowns.song_id
        INNER JOIN songs ON songs.id = songs_artists.song_id
        INNER JOIN artists ON artists.id = songs_artists.artist_id
        INNER JOIN artist_hierarchy ON songs_artists.artist_id = artist_hierarchy.id
        WHERE (views_breakdowns.timestamp = CASE WHEN :daysOffset IS NULL
            THEN DATE(:timestamp, '-' || :timePeriodOffset || ' day')
            ELSE DATE(DATE(:timestamp, '-' || :daysOffset || ' day'), '-' || :timePeriodOffset || ' day')
        END)
        AND (:songPublishDate IS NULL OR songs.publish_date LIKE :songPublishDate)
        AND (:publishDate IS NULL OR artists.publish_date LIKE :publishDate)
        AND (songs_artists.artist_category = :artistCategory OR :artistCategory IS NULL)
        AND (:parentArtistId IS NULL or artists.base_artist_id = :parentArtistId)
        AND (:search IS NULL OR EXISTS (
            SELECT artists_names.artist_id 
            FROM artists_names 
            WHERE (artists_names.artist_id = songs_artists.artist_id) 
                AND (artists_names.name LIKE :search)
            LIMIT 1
            ))
        AND (views_breakdowns.views = CASE WHEN :singleVideo IS NULL
            THEN views_breakdowns.views
            ELSE
                (SELECT MAX(sub_vb.views)
                FROM views_breakdowns AS sub_vb 
                INNER JOIN songs ON songs.id = sub_vb.song_id
                INNER JOIN songs_artists ON songs_artists.song_id = sub_vb.song_id
                INNER JOIN artists ON artists.id = songs_artists.artist_id
                INNER JOIN artists_names ON artists_names.artist_id = artists.id
                WHERE (sub_vb.view_type = views_breakdowns.view_type)
                    AND (sub_vb.timestamp = views_breakdowns.timestamp)
                    AND (sub_vb.song_id = views_breakdowns.song_id)
                    AND (:songPublishDate IS NULL OR songs.publish_date LIKE :songPublishDate)
                    AND (:publishDate IS NULL OR artists.publish_date LIKE :publishDate)
                    AND (songs_artists.artist_category = :artistCategory OR :artistCategory IS NULL)
                    AND (:parentArtistId IS NULL or artists.base_artist_id = :parentArtistId)
                    AND (artists_names.name LIKE :search OR :search IS NULL)${filterOffsetSubIncludeSourceTypesStatement}${filterOffsetSubExcludeSourceTypesStatement}${filterIncludeSongTypesStatement}${filterExcludeSongTypesStatement}${filterIncludeArtistTypesStatement}${filterExcludeArtistTypesStatement}${filterIncludeArtistsStatement}${filterExcludeArtistsStatement}${filterIncludeSongsStatement}${filterExcludeSongsStatement}
                GROUP BY sub_vb.song_id)
            END)${filterIncludeSourceTypesStatement}${filterExcludeSourceTypesStatement}${filterIncludeSongTypesStatement}${filterExcludeSongTypesStatement}${filterIncludeArtistTypesStatement}${filterExcludeArtistTypesStatement}${filterIncludeArtistsStatement}${filterExcludeArtistsStatement}${filterIncludeSongsStatement}${filterExcludeSongsStatement}
        GROUP BY (CASE WHEN :combineSimilarArtists IS NULL THEN artists.id
                WHEN artists.base_artist_id IS NULL then artists.id
                ELSE artist_hierarchy.root_artist_id
            END)
    ),
    period_offset_co_artists AS (
        SELECT 
            (CASE WHEN :combineSimilarArtists IS NULL THEN artists.id
                WHEN artists.base_artist_id IS NULL THEN artists.id
                ELSE artist_hierarchy.root_artist_id
            END) AS artist_id,
            (CASE WHEN :orderBy = 4 THEN COUNT(DISTINCT songs.id) ELSE SUM(views_breakdowns.views) END) AS views  
        FROM views_breakdowns
        INNER JOIN songs_artists AS base_songs_artists ON songs_artists.song_id = views_breakdowns.song_id
        INNER JOIN songs ON songs.id = songs_artists.song_id
        INNER JOIN songs_artists ON base_songs_artists.song_id = songs.id
        INNER JOIN artists ON artists.id = songs_artists.artist_id
        INNER JOIN artist_hierarchy ON songs_artists.artist_id = artist_hierarchy.id
        WHERE (views_breakdowns.timestamp = CASE WHEN :daysOffset IS NULL
            THEN DATE(:timestamp, '-' || :timePeriodOffset || ' day')
            ELSE DATE(DATE(:timestamp, '-' || :daysOffset || ' day'), '-' || :timePeriodOffset || ' day')
        END)
        AND (:songPublishDate IS NULL OR songs.publish_date LIKE :songPublishDate)
        AND (:publishDate IS NULL OR artists.publish_date LIKE :publishDate)
        AND (songs_artists.artist_category = :artistCategory OR :artistCategory IS NULL)
        AND (:parentArtistId IS NULL or artists.base_artist_id = :parentArtistId)
        AND (:search IS NULL OR EXISTS (
            SELECT artists_names.artist_id 
            FROM artists_names 
            WHERE (artists_names.artist_id = songs_artists.artist_id) 
                AND (artists_names.name LIKE :search)
            LIMIT 1
            ))
        AND (views_breakdowns.views = CASE WHEN :singleVideo IS NULL
            THEN views_breakdowns.views
            ELSE
                (SELECT MAX(sub_vb.views)
                FROM views_breakdowns AS sub_vb 
                INNER JOIN songs ON songs.id = sub_vb.song_id
                INNER JOIN songs_artists ON songs_artists.song_id = sub_vb.song_id
                INNER JOIN artists ON artists.id = songs_artists.artist_id
                INNER JOIN artists_names ON artists_names.artist_id = artists.id
                WHERE (sub_vb.view_type = views_breakdowns.view_type)
                    AND (sub_vb.timestamp = views_breakdowns.timestamp)
                    AND (sub_vb.song_id = views_breakdowns.song_id)
                    AND (:songPublishDate IS NULL OR songs.publish_date LIKE :songPublishDate)
                    AND (:publishDate IS NULL OR artists.publish_date LIKE :publishDate)
                    AND (songs_artists.artist_category = :artistCategory OR :artistCategory IS NULL)
                    AND (:parentArtistId IS NULL or artists.base_artist_id = :parentArtistId)
                    AND (artists_names.name LIKE :search OR :search IS NULL)${filterOffsetSubIncludeSourceTypesStatement}${filterOffsetSubExcludeSourceTypesStatement}${filterIncludeSongTypesStatement}${filterExcludeSongTypesStatement}${filterIncludeArtistTypesStatement}${filterExcludeArtistTypesStatement}${filterIncludeArtistsStatement}${filterExcludeArtistsStatement}${filterIncludeSongsStatement}${filterExcludeSongsStatement}${filterIncludeCoArtistsOfStatement}
                GROUP BY sub_vb.song_id)
            END)${filterIncludeSourceTypesStatement}${filterExcludeSourceTypesStatement}${filterIncludeSongTypesStatement}${filterExcludeSongTypesStatement}${filterIncludeArtistTypesStatement}${filterExcludeArtistTypesStatement}${filterIncludeArtistsStatement}${filterExcludeArtistsStatement}${filterIncludeSongsStatement}${filterExcludeSongsStatement}${filterIncludeCoArtistsOfStatement}
        GROUP BY (CASE WHEN :combineSimilarArtists IS NULL THEN artists.id
                WHEN artists.base_artist_id IS NULL then artists.id
                ELSE artist_hierarchy.root_artist_id
            END)
    )
    SELECT no_period_offset.artist_id,
        (SUM(CASE WHEN :includeCoArtistsOf IS NULL THEN no_period_offset.views ELSE no_period_offset_co_artists.views END) - (CASE WHEN :timePeriodOffset IS NULL
                THEN 0
                ELSE IFNULL( (CASE WHEN :includeCoArtistsOf IS NULL THEN period_offset.views ELSE period_offset_co_artists.views END), 0)
            END)
        ) AS total_views,
        COUNT(*) OVER() as total_count
    FROM no_period_offset
    LEFT JOIN artists ON artists.id = no_period_offset.artist_id
    LEFT JOIN period_offset ON (:timePeriodOffset IS NOT NULL) AND (period_offset.artist_id = no_period_offset.artist_id)
    LEFT JOIN no_period_offset_co_artists ON (:includeCoArtistsOf IS NOT NULL) AND (no_period_offset_co_artists.artist_id = no_period_offset.artist_id)
    LEFT JOIN period_offset_co_artists ON (:timePeriodOffset IS NOT NULL) AND (:includeCoArtistsOf IS NOT NULL) AND (period_offset_co_artists.artist_id = no_period_offset_co_artists.artist_id)
    GROUP BY no_period_offset.artist_id
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
                    THEN DATE(artists.publish_date)
                WHEN 2 
                    THEN DATE(artists.addition_date)
                ELSE total_views
            END
        END ASC,
        CASE WHEN :direction = 1 THEN 1
        ELSE
            CASE :orderBy
                WHEN 1 
                    THEN DATE(artists.publish_date)
                WHEN 2 
                    THEN DATE(artists.addition_date)
                ELSE total_views
            END
        END DESC
    LIMIT :maxEntries
    OFFSET :startAt`).all(queryParams.params) as RawArtistRankingResult[]
}

function filterArtistRankingsSync(
    filterParams: ArtistRankingsFilterParams = new ArtistRankingsFilterParams()
): ArtistRankingsFilterResult {
    const queryParams = getArtistRankingsFilterQueryParams(filterParams)

    const primaryResult = filterArtistRankingsRawSync(queryParams)

    // handle change offset
    const changeOffset = filterParams.changeOffset
    const changeOffsetMap: { [key: string]: number } = {}
    if (changeOffset && changeOffset > 0) {
        const changeOffsetResult = filterArtistRankingsRawSync(getArtistRankingsFilterQueryParams(filterParams, changeOffset))
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

    // build & return ranking result
    return {
        totalCount: primaryResult[0]?.total_count || 0,
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

function getMostRecentViewsTimestampSync(
    timestamp: string | null = new Date().toISOString() // the ISO timestamp to normalize
): string | null {
    const result = db.prepare(`
    SELECT timestamp
    FROM (
        SELECT timestamp
        FROM views_metadata
        WHERE datetime(timestamp) >= datetime(:timestamp)
        ORDER BY timestamp ASC
        LIMIT 1
    )
    UNION ALL
    SELECT timestamp
    FROM (
        SELECT timestamp
        FROM views_metadata
        WHERE datetime(timestamp) < datetime(:timestamp)
        ORDER BY timestamp DESC
        LIMIT 1
    )
    LIMIT 1
    `).get({
        timestamp: timestamp
    }) as { timestamp: string }
    return result ? result.timestamp : null
}

function timestampExistsSync(
    timestamp: string
): boolean {
    return db.prepare(`
    SELECT timestamp
    FROM views_metadata
    WHERE timestamp = ?
    `).get(timestamp) ? true : false
}

export function getMostRecentViewsTimestamp(
    timestamp?: string
): Promise<string | null> {
    return new Promise<string | null>((resolve, reject) => {
        try {
            resolve(getMostRecentViewsTimestampSync(timestamp))
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
    timestamp?: string | null
): HistoricalViewsResult {
    const recentTimestamp = getMostRecentViewsTimestampSync(timestamp)
    if (!recentTimestamp) {
        return {
            range: range,
            period: period,
            startAt: recentTimestamp,
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
            timestamp: recentTimestamp
        }) as HistoricalViews
        views.push(dbResult.views)
        const dbResultTimestamp = dbResult.timestamp
        if (dbResultTimestamp) {
            timestamps.push(dbResultTimestamp)
        } else {
            const timestampDate = new Date(recentTimestamp)
            timestampDate.setDate(timestampDate.getDate() - daysOffset)
            timestamps.push(generateTimestamp(timestampDate) || dbResultTimestamp)
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
        startAt: recentTimestamp,
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

    return {
        id: artistData.id,
        type: type,
        publishDate: new Date(artistData.publish_date),
        additionDate: new Date(artistData.addition_date),
        names: names,
        thumbnails: thumbnails,
        averageColor: artistData.average_color,
        darkColor: artistData.dark_color,
        lightColor: artistData.light_color,
        placement: placement,
        views: views,
        baseArtist: baseArtist,
        baseArtistId: artistData.base_artist_id
    }
}

function getArtistViewsSync(
    id: Id,
    timestamp?: string
): Views | null {
    const recentTimestamp = getMostRecentViewsTimestampSync(timestamp)
    if (!recentTimestamp) {
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
        timestamp: recentTimestamp
    }) as RawViewBreakdown[]

    return buildEntityViews(
        viewsBreakdown,
        recentTimestamp
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

        allTimePlacement = 0 //filterArtistRankingsCountSync(getFilterArtistsQueryParams(allTimePlacementFilterParams))
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
        (baseArtistId !== undefined) && getBaseArtist ? getArtistSync(baseArtistId, getViews, false) : null
    )
}

function getArtistNamesSync(
    id: Id
): Names {
    const artistNames = db.prepare(`
    SELECT name, name_type
    FROM artists_names
    WHERE artist_id = ?`).all(id) as RawArtistName[]

    return buildNames(artistNames)
}

function insertArtistNamesSync(
    id: Id,
    names: Names
) {
    for (const rawType in names) {
        const type = Number(rawType) as NameType
        const name = names[type]

        if (name) db.prepare(`
        INSERT INTO artists_names (artist_id, name, name_type)
        VALUES (?, ?, ?)
        `).run(id, name, type);
    }
}

function insertArtistThumbnailsSync(
    id: Id,
    thumbnails: ArtistThumbnails
) {
    for (const rawType in thumbnails) {
        const type = Number(rawType) as ArtistThumbnailType
        const thumbnail = thumbnails[type]

        if (thumbnail) db.prepare(`
        INSERT INTO artists_thumbnails (thumbnail_type, url, artist_id)
        VALUES (?, ?, ?)
        `).run(type, thumbnail, id);
    }
}

function insertArtistSync(
    artist: Artist
): Artist {
    const id = artist.id

    // insert artist
    db.prepare(`
    INSERT INTO artists (id, artist_type, publish_date, addition_date, base_artist_id, average_color, dark_color, light_color)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        id,
        artist.type,
        artist.publishDate.toISOString(),
        artist.additionDate.toISOString(),
        artist.baseArtistId,
        artist.averageColor,
        artist.darkColor,
        artist.lightColor
    )

    // insert names
    insertArtistNamesSync(id, artist.names)

    // insert thumbnails
    insertArtistThumbnailsSync(id, artist.thumbnails)

    return artist
}

function updateArtistSync(
    artist: Partial<Artist> & Pick<Artist, 'id'>
): Artist {
    const id = artist.id

    const fieldMap: Record<string, string> = {
        type: 'artist_type',
        publishDate: 'publish_date',
        additionDate: 'addition_date',
        baseArtistId: 'base_artist_id',
        averageColor: 'average_color',
        darkColor: 'dark_color',
        lightColor: 'light_color'
    }

    const sets: string[] = []
    const values: any[] = []
    for (const key in artist) {
        const value = artist[key as keyof typeof artist]
        const mapped = fieldMap[key]
        if (mapped && value !== undefined) {
            sets.push(`${mapped} = ?`)
            if (value instanceof Date) {
                values.push(value.toISOString())
            } else {
                values.push(value)
            }
        }
    }

    // update artist
    db.transaction(() => {

        if (sets.length > 0) db.prepare(`
        UPDATE artists
        SET ${sets.join(', ')}
        WHERE id = ?
        `).run([...values, id]);

        // update names
        const names = artist.names
        if (names) {
            db.prepare(`
            DELETE FROM artists_names
            WHERE artist_id = ?`).run(id)

            insertArtistNamesSync(id, names)
        }

        // update thumbnails
        const thumbnails = artist.thumbnails
        if (thumbnails) {
            db.prepare(`
            DELETE FROM artists_thumbnails
            WHERE artist_id = ?`).run(id)

            insertArtistThumbnailsSync(id, thumbnails)
        }

    })()

    // return the updated artist object
    return getArtistSync(id) as Artist
}

function deleteArtistSync(
    artistId: Id,
) {
    db.prepare(`
    DELETE FROM artists
    WHERE id = ?
    `).run(artistId)
}

function artistExistsSync(
    id: Id,
) {
    return db.prepare(`
    SELECT id
    FROM artists
    WHERE id = ?
    `).get(id) ? true : false
}

function buildSearchArtistsQueryParams(
    query: string,
    maxEntries: number = 50,
    startAt: number = 0,
    excludeArtists?: Id[],
): SqlSearchArtistsFilterParams {

    const queryParams: { [key: string]: any } = {
        query: `%${query}%`,
        maxEntries: maxEntries,
        startAt: startAt,
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

    return {
        excludeArtists: excludeArtists ? buildInStatement(excludeArtists, 'excludeArtists') : '',
        params: queryParams
    }
}

function searchArtistsSync(
    query: string,
    maxEntries: number = 50,
    startAt: number = 0,
    excludeArtists?: Id[],
): Artist[] {
    const params = buildSearchArtistsQueryParams(query, maxEntries, startAt, excludeArtists)

    const excludeArtistsValues = params.excludeArtists
    const excludeArtistsStatement = excludeArtistsValues ? ` AND (artists.id NOT IN (${excludeArtistsValues}))` : ''

    const results = db.prepare(`
        SELECT DISTINCT id
        FROM artists
        INNER JOIN artists_names ON artists_names.artist_id = id
        WHERE (artists_names.name LIKE :query)${excludeArtistsStatement}
        LIMIT :maxEntries
        OFFSET :startAt
    `).all(params.params) as { id: number }[]

    // get artists from the ids
    const artists: Artist[] = []

    for (const result of results) {
        const artist = getArtistSync(result.id, false, false)
        if (artist) artists.push(artist)
    }

    // return the artists
    return artists
}

export function getArtistPlacement(
    id: Id,
    views?: Views | null
): Promise<ArtistPlacement | null> {
    return new Promise<ArtistPlacement | null>((resolve, reject) => {
        try {
            const artistData = db.prepare(`
            SELECT id, artist_type, publish_date, addition_date, base_artist_id, average_color, dark_color, light_color
            FROM artists
            WHERE id = ?`).get(id) as RawArtistData

            const viewData = views || getArtistViewsSync(id)

            // return null if the artist doesn't exist.
            if (artistData == undefined || viewData == null) return resolve(null)

            resolve(getArtistPlacementSync(artistData, viewData))
        } catch (error) {
            reject(error)
        }
    })
}

export function getArtistViews(
    id: Id
): Promise<Views | null> {
    return new Promise<Views | null>((resolve, reject) => {
        try {
            resolve(getArtistViewsSync(id))
        } catch (error) {
            reject(error)
        }
    })
}

export function getArtist(
    id: Id,
    getViews: boolean = true,
    getBaseArtist: boolean = true
): Promise<Artist | null> {
    return new Promise<Artist | null>((resolve, reject) => {
        try {
            resolve(getArtistSync(id, getViews, getBaseArtist))
        } catch (error) {
            reject(error)
        }
    })
}

export function getArtistNames(
    id: Id
): Promise<Names> {
    return new Promise((resolve, reject) => {
        try {
            resolve(getArtistNamesSync(id))
        } catch (error) {
            reject(error)
        }
    })
}

export function insertArtist(
    artist: Artist
): Promise<Artist> {
    return new Promise((resolve, reject) => {
        try {
            resolve(insertArtistSync(artist))
        } catch (error) {
            reject(error)
        }
    })
}

export function updateArtist(
    artist: Partial<Artist> & Pick<Artist, 'id'>
): Promise<Artist> {
    return new Promise((resolve, reject) => {
        try {
            resolve(updateArtistSync(artist))
        } catch (error) {
            reject(error)
        }
    })
}

export function deleteArtist(
    id: Id
): Promise<void> {
    return new Promise((resolve, reject) => {
        try {
            resolve(deleteArtistSync(id))
        } catch (error) {
            reject(error)
        }
    })
}

export function getArtistHistoricalViews(
    id: Id,
    range: number = 7,
    period: number = 1,
    timestamp?: string
): Promise<HistoricalViewsResult> {
    const recentTimestamp = getMostRecentViewsTimestampSync(timestamp)
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
                recentTimestamp
            ))
        } catch (error) {
            reject(error)
        }
    })
}

export function searchArtists(
    query: string,
    maxEntries?: number,
    startAt?: number,
    excludeArtists?: Id[]
): Promise<Artist[]> {
    return new Promise<Artist[]>((resolve, reject) => {
        try {
            resolve(searchArtistsSync(query, maxEntries, startAt, excludeArtists))
        } catch (error) {
            reject(error)
        }
    })
}

function buildNames(
    rawNames: RawSongName[] | RawArtistName[]
): Names {
    // process names
    const names: Names = {
        [NameType.ORIGINAL]: ''
    }
    for (const nameData of rawNames) {
        names[nameData.name_type as NameType] = nameData.name
    }
    return names
}

// Song
function buildSong(
    songData: RawSongData,
    songNames: RawSongName[],
    songArtistsCategories: SongArtistsCategories,
    songArtists: Artist[],
    songVideoIds: RawSongVideoId[],
    songViews: Views | null,
    songPlacement: SongPlacement | null
): Song {
    const songId = songData.id

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
    return {
        id: songId,
        publishDate: new Date(songData.publish_date),
        additionDate: new Date(songData.addition_date),
        type: songData.song_type as SongType,
        thumbnail: thumb,
        maxresThumbnail: maxresThumb,
        averageColor: songData.average_color,
        darkColor: songData.dark_color,
        lightColor: songData.light_color,
        artistsCategories: songArtistsCategories,
        artists: songArtists,
        names: buildNames(songNames),
        videoIds: videoIds,
        thumbnailType: thumbType,
        views: songViews,
        placement: songPlacement,
        lastUpdated: new Date(songData.last_updated),
        lastRefreshed: songData.last_refreshed ? new Date(songData.last_refreshed) : null,
        isDormant: songData.dormant == 1 ? true : false,
        fandomUrl: songData.fandom_url
    }
}

function getSongViewsSync(
    songId: Id,
    timestamp?: string | null
): Views | null {
    const recentTimestamp = getMostRecentViewsTimestampSync(timestamp)
    if (!recentTimestamp) {
        return buildEntityViews([])
    }

    const breakdowns = db.prepare(`
    SELECT views, video_id, view_type
    FROM views_breakdowns
    WHERE song_id = ? AND timestamp = ?
    ORDER BY views DESC`).all(songId, recentTimestamp) as RawViewBreakdown[]

    return buildEntityViews(
        breakdowns,
        recentTimestamp
    )
}

function insertSongViewsSync(
    songId: Id,
    views: Views
): Views {
    const timestamp = views.timestamp || getMostRecentViewsTimestampSync() || generateTimestamp()

    // delete existing
    db.prepare(`
    DELETE FROM views_breakdowns
    WHERE song_id = ? AND timestamp = ?
    `).run(songId, timestamp)

    // iterate breakdown
    const breakdowns = views.breakdown
    for (const rawSourceType in breakdowns) {
        const sourceType = Number(rawSourceType) as SourceType
        const breakdown = breakdowns[sourceType]
        if (breakdown) {
            for (const views of breakdown) {
                db.prepare(`
                INSERT OR REPLACE INTO views_breakdowns (song_id, timestamp, views, video_id, view_type)
                VALUES (?, ?, ?, ?, ?)
                `).run(
                    songId,
                    timestamp,
                    views.views,
                    views.id,
                    sourceType
                )
            }
        }
    }

    return views
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
        allTimePlacementFilterParams.maxEntries = 1

        allTimePlacement = filterSongRankingsSync(allTimePlacementFilterParams).totalCount
    }

    // get release year placement
    let releaseYearPlacement: number
    {
        const releaseYear = (new Date(songData.publish_date)).getFullYear() + "%"
        // get placement
        const releaseYearPlacementFilterParams = new SongRankingsFilterParams()
        releaseYearPlacementFilterParams.minViews = Number(songViews.total)
        releaseYearPlacementFilterParams.publishDate = releaseYear
        releaseYearPlacementFilterParams.maxEntries = 1

        releaseYearPlacement = filterSongRankingsSync(releaseYearPlacementFilterParams).totalCount
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
        SELECT id, publish_date, addition_date, song_type, thumbnail, maxres_thumbnail, thumbnail_type, average_color, dark_color, light_color, fandom_url, last_updated, dormant, last_refreshed
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
    const existingArtists: { [key: number]: boolean } = {}
    const artistsCategories: SongArtistsCategories = {
        [ArtistCategory.VOCALIST]: [],
        [ArtistCategory.PRODUCER]: []
    }
    songArtists.forEach(rawArtist => {
        const id = rawArtist.artist_id as number
        const category = rawArtist.artist_category as ArtistCategory
        const categoryArtists = artistsCategories[category]

        categoryArtists.push(id)

        const artist = !existingArtists[id] ? getArtistSync(id, false, false) : null
        if (artist) {
            existingArtists[id] = true
            artists.push(artist)
        }
    })
    const songViews = getViews ? getSongViewsSync(songId) : null
    const songPlacement = songViews ? getSongPlacementSync(songData, songViews) : null

    return buildSong(
        songData,
        songNames,
        artistsCategories,
        artists,
        songVideoIds,
        songViews,
        songPlacement
    )
}

function getSongNamesSync(
    songId: Id
): Names {
    // get names
    const songNames = db.prepare(`
    SELECT name, name_type 
    FROM songs_names
    WHERE song_id = ?`).all(songId) as RawSongName[]

    return buildNames(songNames)
}

function insertSongNamesSync(
    songId: Id,
    names: Names
) {
    for (const nameType in names) {
        const type = Number.parseInt(nameType) as NameType
        const name = names[type]

        if (name) db.prepare(`
            INSERT INTO songs_names (song_id, name, name_type)
            VALUES (?, ?, ?)
            `).run(songId, name, type);
    }
}

function insertSongArtistsSync(
    songId: Id,
    categories: SongArtistsCategories
) {
    for (const rawCategory in categories) {
        const category = Number(rawCategory) as ArtistCategory

        for (const id of categories[category]) {
            db.prepare(`
                INSERT INTO songs_artists (song_id, artist_id, artist_category)
                VALUES (?, ?, ?)
                `).run(
                songId,
                id,
                category
            )
        }
    }
}

function insertSongVideoIds(
    songId: Id,
    videoIds: SongVideoIds
) {
    for (const rawSourceType in videoIds) {
        const sourceType = Number(rawSourceType) as SourceType
        const ids = videoIds[sourceType]
        for (const videoId of ids || []) {
            db.prepare(`
            INSERT INTO songs_video_ids (song_id, video_id, video_type)
            VALUES (?, ?, ?)
            `).run(
                songId,
                videoId,
                sourceType
            )
        }
    }
}

function insertSongSync(
    song: Song
): Song {
    const songId = song.id

    db.transaction(() => {
        // create song data
        db.prepare(`
        INSERT INTO songs (id, publish_date, addition_date, song_type, thumbnail, maxres_thumbnail, thumbnail_type, average_color, dark_color, light_color, fandom_url, last_updated, dormant, last_refreshed)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            songId,
            song.publishDate.toISOString(),
            song.additionDate.toISOString(),
            song.type,
            song.thumbnail,
            song.maxresThumbnail,
            song.thumbnailType,
            song.averageColor,
            song.darkColor,
            song.lightColor,
            song.fandomUrl,
            song.lastUpdated.toISOString(),
            song.isDormant ? 1 : 0,
            song.lastRefreshed ? song.lastRefreshed.toISOString() : null
        )

        // create names
        insertSongNamesSync(songId, song.names)

        // create song artists if they don't exist
        for (const artist of song.artists) {
            // insert the artist if it doesn't exist
            if (!artistExistsSync(artist.id)) insertArtistSync(artist)
        }

        // add songs artists connections
        insertSongArtistsSync(songId, song.artistsCategories)

        // add video ids
        insertSongVideoIds(songId, song.videoIds)

        // insert views
        if (song.views) insertSongViewsSync(song.id, song.views)
    })()

    return song
}

function updateSongSync(
    song: Partial<Song> & Pick<Song, 'id'>
): Song {
    const songId = song.id

    const fields: Record<string, string> = {
        publishDate: 'publish_date',
        additionDate: 'addition_date',
        type: 'song_type',
        thumbnail: 'thumbnail',
        maxresThumbnail: 'maxres_thumbnail',
        thumbnailType: 'thumbnail_type',
        averageColor: 'average_color',
        darkColor: 'dark_color',
        lightColor: 'light_color',
        fandomUrl: 'fandom_url',
        isDormant: 'dormant',
        lastRefreshed: 'last_refreshed'
    }

    const sets: string[] = []
    const values: any[] = []
    for (const key in song) {
        const value = song[key as keyof typeof song]
        const field = fields[key]
        if (field && value !== undefined) {
            sets.push(`${field} = ?`)
            if (value instanceof Date) {
                values.push(value.toISOString())
            } else {
                switch (typeof (value)) {
                    case 'boolean':
                        values.push(value ? 1 : 0)
                        break;
                    default:
                        values.push(value)
                }
            }
        }
    }

    // add last updated
    sets.push('last_updated = ?')
    values.push(new Date().toISOString())

    db.transaction(() => {
        if (sets.length > 0) db.prepare(`
            UPDATE songs
            SET ${sets.join(', ')}
            WHERE id = ?
            `).run([...values, songId])

        // update names
        const names = song.names
        if (names) {
            // delete old
            db.prepare(`
            DELETE FROM songs_names
            WHERE song_id = ?
            `).run(songId)

            // insert new
            insertSongNamesSync(songId, names)
        }

        // insert artists that don't exist
        if (song.artists) for (const artist of song.artists) {
            if (!artistExistsSync(artist.id)) insertArtistSync(artist)
        };

        // update artists
        const categories = song.artistsCategories
        if (categories) {
            // delete old
            db.prepare(`
            DELETE FROM songs_artists
            WHERE song_id = ?
            `).run(songId)

            // insert new
            insertSongArtistsSync(songId, categories)
        }

        // update video ids
        const videoIds = song.videoIds
        if (videoIds) {
            // delete old
            db.prepare(`
            DELETE FROM songs_video_ids
            WHERE song_id = ?
            `).run(songId)

            // insert new
            insertSongVideoIds(songId, videoIds)
        }
    })()

    return getSongSync(songId) as Song
}

function deleteSongSync(
    id: Id
) {
    db.prepare(`
    DELETE FROM songs
    WHERE id = ?
    `).run(id)
}

function songExistsSync(
    id: Id,
) {
    return db.prepare(`
    SELECT id
    FROM songs
    WHERE id = ?
    `).get(id) ? true : false
}

export function songExists(
    id: Id
): Promise<boolean> {
    return new Promise((resolve, reject) => {
        try {
            resolve(songExistsSync(id))
        } catch (error) {
            reject(error)
        }
    })
}

export function getSongPlacement(
    id: Id,
    views?: Views | null
): Promise<SongPlacement | null> {
    return new Promise<SongPlacement | null>((resolve, reject) => {
        try {
            const songData = db.prepare(`
                SELECT id, publish_date, addition_date, song_type, thumbnail, maxres_thumbnail, thumbnail_type, average_color, dark_color, light_color, fandom_url, last_updated, dormant
                FROM songs
                WHERE id = ?`).get(id) as RawSongData

            const viewData = views || getSongViewsSync(id)
            // resolve with null if the song was not found
            if (songData == undefined || viewData == null) return resolve(null)

            resolve(getSongPlacementSync(songData, viewData))
        } catch (error) {
            reject(error)
        }
    })
}

export function getSongViews(
    id: Id
): Promise<Views | null> {
    return new Promise<Views | null>((resolve, reject) => {
        try {
            resolve(getSongViewsSync(id))
        } catch (error) {
            reject(error)
        }
    })
}

export function insertSongViews(
    id: Id,
    views: Views
): Promise<Views> {
    return new Promise((resolve, reject) => {
        try {
            resolve(insertSongViewsSync(id, views))
        } catch (error) {
            reject(error)
        }
    })
}

export function getSong(
    id: Id,
    getViews: boolean = true
): Promise<Song | null> {
    return new Promise<Song | null>((resolve, reject) => {
        try {
            resolve(getSongSync(id, getViews))
        } catch (error) {
            reject(error)
        }
    })
}

export function getSongNames(
    id: Id
): Promise<Names> {
    return new Promise((resolve, reject) => {
        try {
            resolve(getSongNamesSync(id))
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

export function insertSong(
    song: Song
): Promise<Song> {
    return new Promise((resolve, reject) => {
        try {
            resolve(insertSongSync(song))
        } catch (error) {
            reject(error)
        }
    })
}

export function updateSong(
    song: Partial<Song> & Pick<Song, 'id'>
): Promise<Song> {
    return new Promise((resolve, reject) => {
        try {
            resolve(updateSongSync(song))
        } catch (error) {
            reject(error)
        }
    })
}

export function deleteSong(
    id: Id
): Promise<void> {
    return new Promise((resolve, reject) => {
        try {
            resolve(deleteSongSync(id))
        } catch (error) {
            reject(error)
        }
    })
}

export function deleteSongUser(
    user: User | null,
    id: Id,
): Promise<boolean> {
    return new Promise((resolve, reject) => {
        try {
            if (user && user.accessLevel >= UserAccessLevel.MODERATOR) {
                deleteSongSync(id)
                return resolve(true)
            }
            return resolve(false)
        } catch (error) {
            reject(error)
        }
    })
}

export function getSongHistoricalViews(
    id: Id,
    range = 7,
    period = 1,
    timestamp?: string
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
                getMostRecentViewsTimestampSync(timestamp)
            ))
        } catch (error) {
            reject(error)
        }
    })
}

// View Manipulation

const viewPlatformProviders: { [key in SourceType]: (videoId: string) => Promise<number | null> } = {
    [SourceType.YOUTUBE]: YouTube.getViews,
    [SourceType.NICONICO]: Niconico.getViews,
    [SourceType.BILIBILI]: bilibili.getViews
};

async function getPlatformViews(
    videoId: string,
    platform: SourceType,
    maxRetries: number = 5,
    retryDelay: number = 1000,
    depth: number = 0
): Promise<number> {
    try {
        return await viewPlatformProviders[platform](videoId) || 0
    } catch (error) {
        return maxRetries > depth ? getPlatformViews(videoId, platform, maxRetries, retryDelay, depth) : 0
    }
}

export async function getSongMostRecentViews(
    id: Id,
    timestamp?: string
): Promise<Views | null> {
    try {
        const song = getSongSync(id, false);
        if (!song) return null;

        let totalViews = 0;
        const breakdown: ViewsBreakdown = {};

        for (const [rawSourceType, sourceVideoIds] of Object.entries(song.videoIds)) {
            const sourceType = Number(rawSourceType) as SourceType;

            if (sourceVideoIds) {
                const bucket = [];
                
                for (const videoId of sourceVideoIds) {
                    const views = await getPlatformViews(videoId, sourceType)
                    bucket.push({ id: videoId, views: views });
                    totalViews += views;
                }

                breakdown[sourceType] = bucket;
            }
        }

        return {
            total: totalViews,
            breakdown,
            timestamp
        };
    } catch (error) {
        throw error;
    }
}

let isRefreshing = false;

interface RefreshingSong {
    id: Id,
    dormant: boolean,
    publishTime: number,
    additionTime: number
}

export async function refreshAllSongsViews(
    maxRetries: number = 5,
    retryDelay: number = 1000,
    maxConcurrent: number = 15,
    minDormantPublishAge: number = 365 * 24 * 60 * 60 * 1000, // in milliseconds, the minimum amount of ms since song publish before it can become dormant
    minDormantAdditionAge: number = 3 * 24 * 60 * 60 * 1000, // in milliseconds, the minimum amount of ms since song addition before it can become dormant
    minDormantViews: number = 1500 // the minimum number of daily views a song can have before it can become dormant
): Promise<void> {
    if (isRefreshing) throw new Error('All songs views are already being refreshed.');

    isRefreshing = true;

    try {
        console.log(`Updating all songs' views...`);

        const timeNow = new Date().getTime()
        const timestamp = generateTimestamp();
        if (timestampExistsSync(timestamp)) throw new Error(`Songs views were already refreshed for timestamp "${timestamp}"`);

        // get all non-dormant songs' ids
        const songIds = db.prepare(`SELECT id, publish_date, addition_date, dormant FROM songs`).all() as RawSongData[];

        const refreshingPromises: Promise<void>[] = [];

        const throttledExecutions = async () => {
            for (const rawSong of songIds) {
                if (refreshingPromises.length >= maxConcurrent) {
                    await Promise.all(refreshingPromises);
                    refreshingPromises.length = 0; // Empty the array without creating a new reference.
                }
                refreshingPromises.push(
                    retractAttempt({
                        id: rawSong.id,
                        dormant: rawSong.dormant == 1 ? true : false,
                        publishTime: new Date(rawSong.publish_date).getTime(),
                        additionTime: new Date(rawSong.addition_date).getTime()
                    }, timestamp, 0)
                );
            }
            await Promise.all(refreshingPromises);
        };

        const retractAttempt = async (song: RefreshingSong, timestamp: string, depth: number): Promise<void> => {
            try {
                const previousViews = getSongViewsSync(song.id)
                if (!song.dormant) {
                    const views = await getSongMostRecentViews(song.id, timestamp);
                    if (!views) throw new Error('Most recent views was null.');

                    // if the newest views fall below a certain threshold, return their view counts to their previous state
                    let viewsReverted = false
                    if (previousViews) {
                        const breakdown = views.breakdown
                        const previousBreakdown = previousViews.breakdown
                        let newTotal = 0
                        for (const rawSourceType in previousViews.breakdown) {
                            const sourceType = Number(rawSourceType) as SourceType

                            const bucket = breakdown[sourceType] || []
                            const previousBucket = previousBreakdown[sourceType]
                            const previousMap = previousBucket ? previousBucket.reduce((acc: Record<string, number | bigint>, views) => {
                                acc[views.id] = views.views
                                return acc;
                            }, {}) : null

                            if (previousMap) {
                                bucket.forEach(views => {
                                    const previousViews = previousMap[views.id]
                                    // if 25% previousViews is greater than the most recent views, revert to the previous view count.
                                    if (previousViews && ((Number(previousViews) * 0.25) >= views.views)) {
                                        viewsReverted = true
                                        views.views = previousViews
                                    }
                                    newTotal += Number(views.views)
                                })
                            }
                        }
                        views.total = newTotal || views.total
                    }

                    insertSongViewsSync(song.id, views);
                    console.log(`Refreshed views for (${song.id})`);

                    // make song dormant if necessary
                    if (previousViews
                        && (!viewsReverted)
                        && (minDormantViews >= (Number(views.total) - Number(previousViews.total)))
                        && ((timeNow - song.publishTime) >= minDormantPublishAge)
                        && ((timeNow - song.additionTime) >= minDormantAdditionAge)
                    ) {
                        console.log(`Made (${song.id}) dormant.`)
                        updateSongSync({
                            id: song.id,
                            isDormant: true
                        })
                    }
                } else if (previousViews) {
                    previousViews.timestamp = timestamp
                    insertSongViewsSync(song.id, previousViews)
                }
            } catch (error) {
                console.log(`Error when refreshing song with id (${song.id}). Error: ${error}`);
                if (maxRetries > depth) {
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                    await retractAttempt(song, timestamp, depth + 1);
                }
            }
        };

        await throttledExecutions();

        db.prepare(`INSERT INTO views_metadata (timestamp, updated) VALUES (?, ?)`).run(timestamp, new Date().toISOString());
        console.log(`All songs' views updated.`);

        // get recent songs
        await getVocaDBRecentSongs()
            .then(songs => {
                for (const song of songs) {
                    if (!songExistsSync) insertSongSync(song)
                }
            })
            .catch(error => console.log(`Error when getting recent VocaDB songs: ${error}`))
    } catch (error) {
        throw error;
    } finally {
        isRefreshing = false;
    }
}

if (process.env.NODE_ENV === 'production') {
    // refresh views
    refreshAllSongsViews().catch(error => console.log(`Error when refreshing every songs' views: ${error}`))
}