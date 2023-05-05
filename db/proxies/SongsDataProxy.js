const Database = require("better-sqlite3")
const Artist = require("../dataClasses/Artist")
const ArtistThumbnail = require("../dataClasses/ArtistThumbnail")
const Song = require("../dataClasses/song")
const EntityViews = require("../dataClasses/EntityViews")
const ArtistThumbnailType = require("../enums/ArtistThumbnailType")
const ArtistType = require("../enums/ArtistType")
const SongType = require("../enums/SongType")
const ViewType = require("../enums/ViewType")

const { generateTimestamp } = require("../../server_scripts/shared")
const ArtistCategory = require("../enums/ArtistCategory")
const RankingsFilterResultItem = require("../dataClasses/RankingsFilterResultItem")
const RankingsFilterParams = require("../dataClasses/RankingsFilterParams")
const PlacementChange = require("../enums/PlacementChange")
const RankingsFilterResult = require("../dataClasses/RankingsFilterResult")
const VideoViews = require("../dataClasses/VideoViews")
const HistoricalViews = require("../dataClasses/HistoricalViews")
const ArtistsRankingsFilterParams = require("../dataClasses/ArtistsRankingsFilterParams")
const ArtistsRankingsFilterResultItem = require("../dataClasses/ArtistsRankingsFilterResultItem")
const ArtistsRankingsFilterResult = require("../dataClasses/ArtistsRankingsFilterResult")
const SongPlacement = require("../dataClasses/SongPlacement")
const SearchQueryParams = require("../dataClasses/SearchQueryParams")
const SearchQueryResult = require("../dataClasses/SearchQueryResult")
const SearchQueryResultItem = require("../dataClasses/SearchQueryResultItem")
const SearchQueryResultItemType = require("../enums/SearchQueryResultItemType")
const ArtistPlacement = require("../dataClasses/ArtistPlacement")

function generateISOTimestamp() {
    return new Date().toISOString()
}

module.exports = class SongsDataProxy {

    /**
     * Creates a new SongsDataProxy
     * 
     * @param {Database.Database} db The db for this proxy to use.
     */
    constructor(db) {
        this.db = db
    }

    // private functions

    /**
     * Builds an Artist object and returns it using data provided from the database.
     * 
     * @param {Object} artistData 
     * @param {Object[]} artistNames 
     * @param {Object[]} artistThumbnails
     * @param {EntityViews} [views]
     * @param {ArtistPlacement} [placement]
     * @returns {Artist} The built Artist object.
     */
    #buildArtist(
        artistData,
        artistNames,
        artistThumbnails,
        views,
        placement
    ) {
        // process names
        const names = []
        for (const [_, nameData] of artistNames.entries()) {
            names[nameData.name_type] = nameData.name
        }

        // process thumbnails
        const thumbnails = []
        for (const [_, thumbnailData] of artistThumbnails.entries()) {
            const thumbType = thumbnailData.thumbnail_type
            thumbnails[thumbType] = new ArtistThumbnail(
                ArtistThumbnailType.fromId(thumbType),
                thumbnailData.url
            )
        }
        const type = ArtistType.fromId(artistData.artist_type)

        const baseArtistId = artistData.base_artist_id

        return new Artist(
            artistData.id,
            type,
            type.category,
            artistData.publish_date,
            artistData.addition_date,
            names,
            thumbnails,
            baseArtistId ? this.#getArtistSync(baseArtistId) : null,
            artistData.average_color,
            artistData.dark_color,
            artistData.light_color,
            views,
            placement
        )
    }

    /**
     * Builds an Song object and returns it using data provided from the database.
     * 
     * @param {Object} songData 
     * @param {Object[]} songNames 
     * @param {Artist[]} songArtists
     * @param {EntityViews=} songViews
     * @param {SongPlacement} [songPlacement]
     * @returns {Song} The built Song object.
     */
    #buildSong(
        songData,
        songNames,
        songArtists,
        songVideoIds,
        songViews,
        songPlacement
    ) {
        // process names
        const names = []
        for (const [_, nameData] of songNames.entries()) {
            names[nameData.name_type] = nameData.name
        }
        // process video ids
        const videoIds = []
        for (const [_, videoIdData] of songVideoIds.entries()) {
            const type = videoIdData.video_type
            // get bucket
            let bucket = videoIds[type]
            if (!bucket) {
                bucket = []
                videoIds[type] = bucket
            }
            // add video id to bucket
            bucket.push(videoIdData.video_id)
        }
        // build song
        return new Song(
            songData.id,
            songData.publish_date,
            songData.addition_date,
            SongType.fromId(songData.song_type),
            songData.thumbnail,
            songData.maxres_thumbnail,
            songData.average_color,
            songData.dark_color,
            songData.light_color,
            songData.fandom_url,
            songArtists,
            names,
            videoIds,
            songViews,
            songPlacement,
            ViewType.fromId(songData.thumbnail_type)
        )
    }

    /**
     * Builds an SongViews object using data provided from the database.
     * 
     * @param {Object[]} viewsBreakdowns 
     * @param {string} [timestamp]
     * @returns {EntityViews} The built SongViews object.
     */
    #buildEntityViews(
        viewsBreakdowns,
        timestamp
    ) {
        // process breakdown
        var totalViews = 0
        const breakdown = []
        for (const [_, breakdownData] of viewsBreakdowns.entries()) {
            const type = breakdownData.view_type
            let bucket = breakdown[type]
            if (!bucket) {
                bucket = []
                breakdown[type] = bucket
            }
            // add breakdown to bucket
            const views = breakdownData.views
            bucket.push(new VideoViews(
                breakdownData.video_id,
                views
            ))
            // increment total
            totalViews += views
        }

        return new EntityViews(
            timestamp,
            totalViews,
            breakdown
        )
    }

    /**
     * Synchronously gets the views for the song associated with the provided song id.
     * Returns null if the song does not exist.
     * 
     * @param {number} songId The ID of the song to get.
     * @param {string} [timestamp]
     * @returns {EntityViews|null} The EntityViews associated with songId or null.
     */
    #getSongViewsSync(
        songId,
        timestamp = this.#getMostRecentViewsTimestampSync()
    ) {
        const db = this.db

        const breakdowns = db.prepare(`
        SELECT views, video_id, view_type
        FROM views_breakdowns
        WHERE song_id = ? AND timestamp = ?
        ORDER BY views DESC`).all(songId, timestamp)

        return this.#buildEntityViews(
            breakdowns,
            timestamp
        )
    }

    /**
     * Synchronously gets the views for the artist associated with the provided artist id.
     * Returns null if the artist does not exist.
     * 
     * @param {number} artistId The ID of the artist to get.
     * @param {string} [timestamp]
     * @returns {EntityViews|null} The EntityViews associated with artistId or null.
     */
    #getArtistViewsSync(
        artistId,
        timestamp = this.#getMostRecentViewsTimestampSync()
    ) {
        const db = this.db

        const viewsBreakdown = db.prepare(`
        SELECT views_breakdowns.view_type, SUM(views_breakdowns.views) AS views, 0 AS video_id
        FROM views_breakdowns
        INNER JOIN songs_artists ON songs_artists.artist_id = :id
        WHERE (views_breakdowns.timestamp = :timestamp)
            AND (views_breakdowns.song_id = songs_artists.song_id)
        GROUP BY views_breakdowns.view_type`).all({
            id: artistId,
            timestamp: timestamp
        })

        return this.#buildEntityViews(
            viewsBreakdown,
            timestamp
        )
    }

    /**
     * Builds an artist placement object from rankings.
     * Contains placement information for various rankings.
     * 
     * @param {number} [allTimePlacement] The data for this artist (raw from the database).
     * @returns {ArtistPlacement} The built placement object
     */
    #buildArtistPlacement(
        allTimePlacement = -1
    ) {
        return new ArtistPlacement(
            allTimePlacement
        )
    }

    /**
     * Builds an artist placement object from a artist's data.
     * Contains placement information for various rankings.
     * 
     * @param {Object} artistData The data for this artist (raw from the database).
     * @param {EntityViews} [artistViews] The views data for this artist.
     * @returns {ArtistPlacement} The built ArtistPlacement object
     */
    #getArtistPlacement(
        artistData,
        artistViews
    ) {
        if (!artistViews) {
            artistViews = this.#getSongViewsSync(artistData.id)
        }
        if (!artistViews) {
            return null
        }

        let allTimePlacement
        // get all time placement
        {
            // get placement
            const allTimePlacementFilterParams = new ArtistsRankingsFilterParams()
            allTimePlacementFilterParams.minViews = artistViews.total
            allTimePlacementFilterParams.artistCategory = ArtistType.fromId(artistData.artist_type).category

            allTimePlacement = this.#filterArtistsRankingsCountSync(this.#getFilterArtistsQueryParams(allTimePlacementFilterParams))
        }

        return this.#buildArtistPlacement(
            allTimePlacement
        )
    }

    /**
     * Synchronously gets the artist associated with the provided artist id.
     * Returns null if the artist does not exist.
     * 
     * @param {number} artistId The ID of the artist to get.
     * @param {boolean} getViews Whether or not to get the views & placement of the artist described by artistId.
     * @returns {Artist|null} The artist associated with artistId
     */
    #getArtistSync(
        artistId,
        getViews = true
    ) {
        const db = this.db

        const artistData = db.prepare(`
        SELECT id, artist_type, publish_date, addition_date, base_artist_id, average_color, dark_color, light_color
        FROM artists
        WHERE id = ?`).get(artistId)

        // return null if the artist doesn't exist.
        if (artistData == undefined) { return null }

        const artistNames = db.prepare(`
        SELECT name, name_type
        FROM artists_names
        WHERE artist_id = ?`).all(artistId)

        const artistThumbnails = db.prepare(`
        SELECT thumbnail_type, url
        FROM artists_thumbnails
        WHERE artist_id = ?`).all(artistId)

        const views = getViews ? this.#getArtistViewsSync(artistId) : null
        const placement = views ? this.#getArtistPlacement(artistData, views) : null

        return this.#buildArtist(
            artistData,
            artistNames,
            artistThumbnails,
            views,
            placement
        )
    }

    /**
     * Builds a song placement object from a song's data.
     * Contains placement information for various rankings.
     * 
     * @param {Object} songData The data for this song (raw from the database).
     * @param {EntityViews} songViews The views data for this song.
     * @returns {SongPlacement} The built SongPlacement object
     */
    #buildSongPlacement(
        allTimePlacement,
        releaseYearPlacement
    ) {
        return new SongPlacement(
            allTimePlacement,
            releaseYearPlacement
        )
    }

    /**
     * Synchronously gets a song placement object from a song's data.
     * Contains placement information for various rankings.
     * 
     * @param {Object} songData The data for this song (raw from the database).
     * @param {EntityViews} [songViews] Optional. The views data for this song.
     * @returns {SongPlacement|null} The built SongPlacement object
     */
    #getSongPlacementSync(
        songData,
        songViews
    ) {
        if (!songViews) {
            songViews = this.#getSongViewsSync(songData.id)
        }
        if (!songViews) {
            return null
        }

        let allTimePlacement
        // get all time placement
        {
            // get placement
            const allTimePlacementFilterParams = new RankingsFilterParams()
            allTimePlacementFilterParams.minViews = songViews.total

            allTimePlacement = this.#filterRankingsCountSync(this.#getFilterRankingsQueryParams(allTimePlacementFilterParams))
        }

        // get release year placement
        let releaseYearPlacement
        {

            const releaseYear = (new Date(songData.publish_date)).getFullYear() + "%"
            // get placement
            const releaseYearPlacementFilterParams = new RankingsFilterParams()
            releaseYearPlacementFilterParams.minViews = songViews.total
            releaseYearPlacementFilterParams.publishDate = releaseYear

            releaseYearPlacement = this.#filterRankingsCountSync(this.#getFilterRankingsQueryParams(releaseYearPlacementFilterParams))
        }

        return this.#buildSongPlacement(
            allTimePlacement || 0,
            releaseYearPlacement || 0
        )
    }

    /**
     * Synchronously gets the song associated with the provided song id.
     * Returns null if the song does not exist.
     * 
     * @param {number} songId The ID of the song to get.
     * @param {boolean} [getViews] Whether or not to get the views for this song as well.
     * @returns {Song|null} The song associated with songId
     */
    #getSongSync(
        songId,
        getViews = true
    ) {
        const db = this.db

        const songData = db.prepare(`
        SELECT id, publish_date, addition_date, song_type, thumbnail, maxres_thumbnail, thumbnail_type, average_color, dark_color, light_color, fandom_url
        FROM songs
        WHERE id = ?`).get(songId)

        // resolve with null if the song was not found
        if (songData == undefined) { return null }

        // get names
        const songNames = db.prepare(`
        SELECT name, name_type 
        FROM songs_names
        WHERE song_id = ?`).all(songId)

        // get song artists
        const songArtists = db.prepare(`
        SELECT artist_id, artist_category
        FROM songs_artists
        WHERE song_id = ?`).all(songId)

        // get video ids
        const songVideoIds = db.prepare(`
        SELECT video_id, video_type
        FROM songs_video_ids
        WHERE song_id = ?`).all(songId)

        // get artists data
        const artists = []
        for (const [_, songArtist] of songArtists.entries()) {
            const artist = this.#getArtistSync(songArtist.artist_id, false)
            artist.category = ArtistCategory.fromId(songArtist.artist_category)
            artists.push(artist)
        }

        const songViews = getViews ? this.#getSongViewsSync(songId) : null
        const songPlacement = songViews ? this.#getSongPlacementSync(songData, songViews) : null

        return this.#buildSong(
            songData,
            songNames,
            artists,
            songVideoIds,
            songViews,
            songPlacement
        )
    }

    /**
     * Gets the most recent views timestamp within the database.
     * 
     * @returns {string=} The most recent views timestamp
     */
    #getMostRecentViewsTimestampSync() {
        const result = this.db.prepare(`
        SELECT timestamp
        FROM views_metadata
        ORDER BY timestamp DESC
        LIMIT 1`).get()
        return result ? result.timestamp : null
    }

    /**
     * Gets every views timestamp within the database
     * 
     * @returns {Object[]} An array of objects containing the timestamps.
     */
    #getViewsTimestamps() {
        const result = this.db.prepare(`
        SELECT timestamp
        FROM views_metadata
        ORDER BY timestamp DESC`).all()
        return result || []
    }

    /**
     * Synchronously checks whether the provided timestamp exists within the views_metadata table.
     * 
     * @param timestamp The timestamp to check the existence of.
     * @returns {boolean} Whether the provided timestamp exists or not
     */
    #timestampExistsSync(timestamp) {
        return this.db.prepare(`
        SELECT timestamp 
        FROM views_metadata 
        WHERE timestamp = ? 
        LIMIT 1`).get(timestamp) ? true : false
    }

    /**
     * Gets every artist that has their base artist ID equal to artistID.
     * 
     * @param {number} artistId The ID of the artist to find the children of.
     * @returns {Artist[]}
     */
    #getArtistChildrenSync(artistId) {
        const result = this.db.prepare(`
            SELECT DISTINCT artists.id
            FROM artists
            WHERE base_artist_id = ?`).all(artistId)

        const children = []
        result.forEach(artist => {
            children.push(this.#getArtistSync(artist.id, false))
        })
        return children
    }

    /**
     * Turns the provided RankingsFilterParams object into an object readable by better sqlite3.
     * 
     * @param {RankingsFilterParams} filterParams 
     * @param {number} [daysOffset] 
     * @returns {Object}
     */
    #getFilterRankingsQueryParams(filterParams, daysOffset) {
        const queryParams = {
            timestamp: filterParams.timestamp || this.#getMostRecentViewsTimestampSync(),
            timePeriodOffset: filterParams.timePeriodOffset,
            daysOffset: daysOffset == null ? filterParams.daysOffset : daysOffset + filterParams.daysOffset,
            viewType: filterParams.viewType?.id,
            songType: filterParams.songType?.id,
            artistType: filterParams.artistType?.id,
            publishDate: filterParams.publishDate,
            orderBy: filterParams.orderBy?.id,
            direction: filterParams.direction?.id,
            singleVideo: filterParams.singleVideo && 1,
            maxEntries: filterParams.maxEntries,
            startAt: filterParams.startAt,
            minViews: filterParams?.minViews,
            maxViews: filterParams?.maxViews
        }

        const buildInStatement = (values, prefix = '') => {
            const stringBuilder = []
            for (const [n, value] of values.entries()) {
                const key = `${prefix}${n}`
                stringBuilder.push(`:${key}`)
                queryParams[key] = value
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

    /**
     * Filters rankings and returns the number of rankings entries.
     * 
     * @param {Object} queryParams The parameters to filter by.
     * @returns {number} The number of entires.
     */
    #filterRankingsCountSync(queryParams) {
        const filterArtists = queryParams.filterArtists
        const filterSongs = queryParams.filterSongs

        const filterArtistsStatement = filterArtists == '' ? '' : ` AND (songs_artists.artist_id IN (${filterArtists}) OR artists.base_artist_id IN (${filterArtists}))`
        const filterSongsStatement = filterSongs == '' ? '' : ` AND (songs.id IN (${filterSongs}))`
        return this.db.prepare(`
        SELECT views_breakdowns.song_id
        FROM views_breakdowns
        INNER JOIN songs ON views_breakdowns.song_id = songs.id
        INNER JOIN songs_artists ON songs_artists.song_id = views_breakdowns.song_id
        INNER JOIN artists ON artists.id = songs_artists.artist_id
        WHERE (views_breakdowns.timestamp = CASE WHEN :daysOffset IS NULL
                THEN :timestamp
                ELSE DATE(:timestamp, '-' || :daysOffset || ' day')
                END)
            AND (views_breakdowns.view_type = :viewType OR :viewType IS NULL)
            AND (songs.song_type = :songType OR :songType IS NULL)
            AND (songs.publish_date LIKE :publishDate OR :publishDate IS NULL)
            AND (artists.artist_type = :artistType OR :artistType IS NULL)
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
            ELSE SUM(DISTINCT views_breakdowns.views) >= :minViews END)
            AND (CASE WHEN :maxViews IS NULL
                THEN 1
                ELSE SUM(DISTINCT views_breakdowns.views) <= :maxViews END)
        `).all(queryParams.params)?.length || 0
    }

    /**
     * Filters rankings and returns the filtered rankings entires.
     * This function is a companion to #filterRankingsSync() and shouldn't be used alone.
     * Returns raw data from the database instead of RankingsFilterResultItem objects.
     * 
     * @param {Object} queryParams The parameters to filter by.
     * @returns {Object[]} The raw data from the database containing song ids and view totals.
     */
    #filterRankingsRawSync(queryParams) {
        const filterArtists = queryParams.filterArtists
        const filterSongs = queryParams.filterSongs

        const filterArtistsStatement = filterArtists == '' ? '' : ` AND (songs_artists.artist_id IN (${filterArtists}))`
        const filterSongsStatement = filterSongs == '' ? '' : ` AND (songs.id IN (${filterSongs}))`
        return this.db.prepare(`
        SELECT DISTINCT views_breakdowns.song_id,
            CASE :orderBy
                WHEN 3 THEN (SUM(DISTINCT views_breakdowns.views) - CASE WHEN :timePeriodOffset IS NULL
                    THEN 0
                    ELSE ifnull((
                        SELECT SUM(DISTINCT offset_breakdowns.views) AS offset_views
                        FROM views_breakdowns AS offset_breakdowns
                        INNER JOIN songs ON songs.id = offset_breakdowns.song_id
                        INNER JOIN songs_artists ON songs_artists.song_id = offset_breakdowns.song_id
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
                            AND (offset_breakdowns.views = CASE WHEN :singleVideo IS NULL
                                THEN offset_breakdowns.views
                                ELSE
                                    (SELECT MAX(offset_sub_breakdowns.views)
                                    FROM views_breakdowns AS offset_sub_breakdowns 
                                    INNER JOIN songs ON songs.id = offset_sub_breakdowns.song_id
                                    INNER JOIN songs_artists ON songs_artists.song_id = offset_sub_breakdowns.song_id
                                    INNER JOIN artists ON artists.id = songs_artists.artist_id
                                    WHERE (offset_sub_breakdowns.view_type = offset_breakdowns.view_type)
                                        AND (offset_sub_breakdowns.timestamp = offset_breakdowns.timestamp)
                                        AND (offset_sub_breakdowns.song_id = offset_breakdowns.song_id)
                                        AND (songs.song_type = :songType OR :songType IS NULL)
                                        AND (songs.publish_date LIKE :publishDate OR :publishDate IS NULL)
                                        AND (artists.artist_type = :artistType OR :artistType IS NULL)${filterArtistsStatement}${filterSongsStatement}
                                    GROUP BY offset_sub_breakdowns.song_id)
                                END)${filterArtistsStatement}${filterSongsStatement}
                        GROUP BY offset_breakdowns.song_id
                    ),0)
                END) * (1 / (julianday('now') - julianday(songs.publish_date)))
                ELSE SUM(DISTINCT views_breakdowns.views) - CASE WHEN :timePeriodOffset IS NULL
                    THEN 0
                    ELSE ifnull((
                        SELECT SUM(DISTINCT offset_breakdowns.views) AS offset_views
                        FROM views_breakdowns AS offset_breakdowns
                        INNER JOIN songs ON songs.id = offset_breakdowns.song_id
                        INNER JOIN songs_artists ON songs_artists.song_id = offset_breakdowns.song_id
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
                            AND (offset_breakdowns.views = CASE WHEN :singleVideo IS NULL
                                THEN offset_breakdowns.views
                                ELSE
                                    (SELECT MAX(offset_sub_breakdowns.views)
                                    FROM views_breakdowns AS offset_sub_breakdowns 
                                    INNER JOIN songs ON songs.id = offset_sub_breakdowns.song_id
                                    INNER JOIN songs_artists ON songs_artists.song_id = offset_sub_breakdowns.song_id
                                    INNER JOIN artists ON artists.id = songs_artists.artist_id
                                    WHERE (offset_sub_breakdowns.view_type = offset_breakdowns.view_type)
                                        AND (offset_sub_breakdowns.timestamp = offset_breakdowns.timestamp)
                                        AND (offset_sub_breakdowns.song_id = offset_breakdowns.song_id)
                                        AND (songs.song_type = :songType OR :songType IS NULL)
                                        AND (songs.publish_date LIKE :publishDate OR :publishDate IS NULL)
                                        AND (artists.artist_type = :artistType OR :artistType IS NULL)${filterArtistsStatement}${filterSongsStatement}
                                    GROUP BY offset_sub_breakdowns.song_id)
                                END)${filterArtistsStatement}${filterSongsStatement}
                        GROUP BY offset_breakdowns.song_id
                    ),0)
                END 
            END AS total_views
        FROM views_breakdowns
        INNER JOIN songs ON views_breakdowns.song_id = songs.id
        INNER JOIN songs_artists ON songs_artists.song_id = views_breakdowns.song_id
        INNER JOIN artists ON artists.id = songs_artists.artist_id
        WHERE (views_breakdowns.timestamp = CASE WHEN :daysOffset IS NULL
                THEN :timestamp
                ELSE DATE(:timestamp, '-' || :daysOffset || ' day')
                END)
            AND (views_breakdowns.view_type = :viewType OR :viewType IS NULL)
            AND (songs.song_type = :songType OR :songType IS NULL)
            AND (songs.publish_date LIKE :publishDate OR :publishDate IS NULL)
            AND (artists.artist_type = :artistType OR :artistType IS NULL)
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
        OFFSET :startAt`).all(queryParams.params)
    }

    /**
     * Filters rankings and returns the filtered rankings entries.
     * 
     * @param {RankingsFilterParams} filterParams The parameters to filter by.
     * @returns {RankingsFilterResult} The filtered rankings entries.
     */
    #filterRankingsSync(filterParams) {
        const queryParams = this.#getFilterRankingsQueryParams(filterParams)

        const primaryResult = this.#filterRankingsRawSync(queryParams)
        // handle change offset
        const changeOffset = filterParams.changeOffset
        const changeOffsetMap = {}
        if (changeOffset > 0) {
            const changeOffsetResult = this.#filterRankingsRawSync(this.#getFilterRankingsQueryParams(filterParams, changeOffset))
            for (const [placement, data] of changeOffsetResult.entries()) {
                changeOffsetMap[data.song_id] = placement
            }
        }

        const returnEntries = []
        // generate rankings entries
        const placementOffset = filterParams.startAt
        for (const [placement, data] of primaryResult.entries()) {
            const songId = data.song_id
            const previousPlacement = changeOffsetMap[songId] || placement
            returnEntries.push(new RankingsFilterResultItem(
                placement + 1 + placementOffset,
                previousPlacement == placement ? PlacementChange.SAME :
                    (placement > previousPlacement ? PlacementChange.DOWN : PlacementChange.UP),
                previousPlacement,
                data.total_views,
                this.#getSongSync(songId, false)
            ))
        }

        // get entry count
        const entryCount = this.#filterRankingsCountSync(queryParams)

        return new RankingsFilterResult(
            entryCount,
            queryParams.params.timestamp,
            returnEntries
        )
    }

    /**
     * Turns the provided ArtistsRankingsFilterParams object into an object readable by better sqlite3.
     * 
     * @param {ArtistsRankingsFilterParams} filterParams 
     * @param {number} [daysOffset] 
     * @returns {Object}
     */
    #getFilterArtistsQueryParams(filterParams, daysOffset) {
        const queryParams = {
            timestamp: filterParams.timestamp || this.#getMostRecentViewsTimestampSync(),
            daysOffset: daysOffset == null ? filterParams.daysOffset : daysOffset + filterParams.daysOffset,
            viewType: filterParams.viewType?.id,
            songType: filterParams.songType?.id,
            artistType: filterParams.artistType?.id,
            artistCategory: filterParams.artistCategory?.id,
            publishDate: filterParams.publishDate,
            orderBy: filterParams.orderBy?.id,
            direction: filterParams.direction?.id,
            singleVideo: filterParams.singleVideo && 1,
            combineSimilarArtists: filterParams.combineSimilarArtists && 1,
            maxEntries: filterParams.maxEntries,
            startAt: filterParams.startAt,
            minViews: filterParams.minViews,
            maxViews: filterParams.maxViews
        }

        // build artists statement
        const filterParamsSongs = filterParams.songs
        let filterSongs = ''
        if (filterParamsSongs) {
            const artists = []
            for (const [n, artistId] of filterParamsSongs.entries()) {
                const key = `artist${n}`
                artists.push(`:${key}`)
                queryParams[key] = artistId
            }
            filterSongs = artists.join(',')
        }

        return {
            filterSongs: filterSongs,
            params: queryParams
        }
    }

    /**
     * Filters artists rankings and returns the number of artists rankings entries.
     * 
     * @param {Object} queryParams The parameters to filter by.
     * @returns {number} The number of entires.
     */
    #filterArtistsRankingsCountSync(queryParams) {
        const filterSongs = queryParams.filterSongs
        return this.db.prepare(`
        SELECT DISTINCT 
            CASE WHEN :combineSimilarArtists IS NULL THEN artists.id
                WHEN artists.base_artist_id IS NULL THEN artists.id
                ELSE artists.base_artist_id
            END AS id,
            SUM(DISTINCT views_breakdowns.views) AS total_views
        FROM views_breakdowns
        INNER JOIN songs ON views_breakdowns.song_id = songs.id
        INNER JOIN songs_artists ON songs_artists.song_id = views_breakdowns.song_id
        INNER JOIN artists ON artists.id = songs_artists.artist_id
        WHERE (views_breakdowns.timestamp = CASE WHEN :daysOffset IS NULL
            THEN :timestamp
            ELSE DATE(:timestamp, '-' || :daysOffset || ' day')
            END)
            AND (views_breakdowns.view_type = :viewType OR :viewType IS NULL)
            AND (songs.song_type = :songType OR :songType IS NULL)
            AND (songs.publish_date LIKE :publishDate OR :publishDate IS NULL)
            AND (songs_artists.artist_category = :artistCategory OR :artistCategory IS NULL)
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
                        AND (songs_artists.artist_category = :artistCategory OR :artistCategory IS NULL)
                        ${filterSongs == '' ? '' : `AND (songs.id IN (${filterSongs}))`}
                    GROUP BY sub_vb.song_id)
                END)
            ${filterSongs == '' ? '' : `AND (songs.id IN (${filterSongs}))`}
        GROUP BY 
            CASE WHEN :combineSimilarArtists IS NULL THEN artists.id
            WHEN artists.base_artist_id IS NULL then artists.id
            ELSE artists.base_artist_id
            END
        HAVING (CASE WHEN :minViews IS NULL
            THEN 1
            ELSE total_views >= :minViews END)
            AND (CASE WHEN :maxViews IS NULL
                THEN 1
                ELSE total_views <= :maxViews 
                END)`).all(queryParams.params)?.length || 0
    }

    /**
     * Filters artist rankings and returns the filtered artist rankings entries.
     * This function is a companion to #filterArtistsRankingsSync() and shouldn't be used alone.
     * Returns raw data from the database instead of ArtistsRankingsFilterResultItem objects.
     * 
     * @param {Object} queryParams The parameters to filter by.
     * @returns {Object[]} The raw data from the database containing song ids and view totals.
     */
    #filterArtistsRankingsRawSync(queryParams) {
        const filterSongs = queryParams.filterSongs
        return this.db.prepare(`
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
            END AS id,
            SUM(DISTINCT views_breakdowns.views) AS total_views
        FROM views_breakdowns
        INNER JOIN songs ON views_breakdowns.song_id = songs.id
        INNER JOIN songs_artists ON songs_artists.song_id = views_breakdowns.song_id
        INNER JOIN artists ON artists.id = songs_artists.artist_id
        WHERE (views_breakdowns.timestamp = CASE WHEN :daysOffset IS NULL
            THEN :timestamp
            ELSE DATE(:timestamp, '-' || :daysOffset || ' day')
            END)
            AND (views_breakdowns.view_type = :viewType OR :viewType IS NULL)
            AND (songs.song_type = :songType OR :songType IS NULL)
            AND (songs.publish_date LIKE :publishDate OR :publishDate IS NULL)
            AND (songs_artists.artist_category = :artistCategory OR :artistCategory IS NULL)
            AND (artists.artist_type = :artistType OR :artistType IS NULL)
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
                        AND (songs_artists.artist_category = :artistCategory OR :artistCategory IS NULL)
                        AND (artists.artist_type = :artistType OR :artistType IS NULL)
                        ${filterSongs == '' ? '' : `AND (songs.id IN (${filterSongs}))`}
                    GROUP BY sub_vb.song_id)
                END)
            ${filterSongs == '' ? '' : `AND (songs.id IN (${filterSongs}))`}
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
        OFFSET :startAt`).all(queryParams.params)
    }

    /** Filters artists by the views they have for every song they are in with a time period offset.
     * 
     * @param {Object} queryParams The paramaters to filter by.
     * @param {Number} timePeriodOffset The time period offset.
     */
    #filterArtistsRankingsWithTimePeriodOffsetRaw(queryParams, timePeriodOffset) {
        const primaryResult = this.#filterArtistsRankingsRawSync(queryParams)
        // handle time period offset
        if (timePeriodOffset) {
            const timePeriodOffsetMap = {}
            queryParams.params.daysOffset = timePeriodOffset + (queryParams.params.daysOffset || 0)
            const offsetResult = this.#filterArtistsRankingsRawSync(queryParams)
            for (const [_, data] of offsetResult.entries()) {
                timePeriodOffsetMap[data.id] = data.total_views
            }

            for (const [_, data] of primaryResult.entries()) {
                const offsetViews = timePeriodOffsetMap[data.id] || 0
                data.total_views = data.total_views - offsetViews
            }
        }

        return primaryResult
    }

    /** Filters artists by the views they have for every song they are in. 
     * 
     * @param {ArtistsRankingsFilterParams} filterParams The paramaters to filter by.
     * @return {ArtistsRankingsFilterResult} The filtered artists
    */
    #filterArtistsRankingsSync(filterParams) {
        const queryParams = this.#getFilterArtistsQueryParams(filterParams)

        const primaryResult = this.#filterArtistsRankingsWithTimePeriodOffsetRaw(queryParams, filterParams.timePeriodOffset)
        // handle change offset
        const changeOffset = filterParams.changeOffset
        const changeOffsetMap = {}
        if (changeOffset > 0) {
            const changeOffsetResult = this.#filterArtistsRankingsWithTimePeriodOffsetRaw(this.#getFilterArtistsQueryParams(filterParams, changeOffset), filterParams.timePeriodOffset)
            for (const [placement, data] of changeOffsetResult.entries()) {
                changeOffsetMap[data.id] = placement
            }
        }

        const returnEntries = []
        // generate rankings entries
        const placementOffset = filterParams.startAt
        for (const [placement, data] of primaryResult.entries()) {
            const artistId = data.id
            const previousPlacement = changeOffsetMap[artistId] || placement
            returnEntries.push(new ArtistsRankingsFilterResultItem(
                placement + 1 + placementOffset,
                previousPlacement == placement ? PlacementChange.SAME :
                    (placement > previousPlacement ? PlacementChange.DOWN : PlacementChange.UP),
                previousPlacement,
                data.total_views,
                this.#getArtistSync(artistId, false)
            ))
        }

        // get entry count
        const entryCount = this.#filterArtistsRankingsCountSync(queryParams)

        return new ArtistsRankingsFilterResult(
            entryCount,
            queryParams.params.timestamp,
            returnEntries
        )
    }

    /**
     * Gets a historical views from a prepared statement.
     * 
     * @param {PreparedStatement} statement The BetterSqlite3 PreparedStatement to use to get view data.
     * @param {Object} params Paramaters to pass to the PreparedStatement.
     * @param {number} [range] In days. The number of days in the past to get the historical data of.
     * @param {number} [period] In days. The amount of days between each entry.
     * @param {string} [timestamp] The timestamp to start getting the historical data from.
     * @returns {HistoricalViews[]} An array of HistoricalViews objects depicting the historical views of this artist.
     */
    #getHistoricalViewsSync(
        statement,
        params,
        range = 7,
        period = 1,
        timestamp = this.#getMostRecentViewsTimestampSync()
    ) {
        const views = []
        const timestamps = []
        const historicalViews = []
        for (let i = 0; i < range + 1; i++) {
            const dbResult = statement.get({
                ...params,
                daysOffset: i * period,
                timestamp: timestamp
            })
            views.push(dbResult.views)
            timestamps.push(dbResult.timestamp)
        }
        for (let i = 0; i < views.length - 1; i++) {
            const current = views[i]
            const next = views[i + 1]
            historicalViews.push(new HistoricalViews(
                current - next,
                timestamps[i]
            ))
        }
        return historicalViews
    }

    /**
     * Gets a artist's historical views.
     * 
     * @param {number} id The id of the artist to get the historical views data of.
     * @param {number} [range] In days. The number of days in the past to get the historical data of.
     * @param {number} [period] In days. The amount of days between each entry.
     * @param {string} [timestamp] The timestamp to start getting the historical data from.
     * @returns {HistoricalViews[]} An array of HistoricalViews objects depicting the historical views of this artist.
     */
    #getArtistHistoricalViewsSync(
        id,
        range = 7,
        period = 1,
        timestamp = this.#getMostRecentViewsTimestampSync()
    ) {
        return this.#getHistoricalViewsSync(
            this.db.prepare(`
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
        )
    }

    /**
     * Gets a song's historical views.
     * 
     * @param {number} id The id of the song to get the historical views data of.
     * @param {number} [range] In days. The number of days in the past to get the historical data of.
     * @param {number} [period] In days. The amount of days between each entry.
     * @param {string} [timestamp] The timestamp to start getting the historical data from.
     * @returns {HistoricalViews[]} An array of HistoricalViews objects depicting the historical views of this song.
     */
    #getSongHistoricalViewsSync(
        id,
        range = 7,
        period = 1,
        timestamp = this.#getMostRecentViewsTimestampSync()
    ) {
        return this.#getHistoricalViewsSync(
            this.db.prepare(`
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
        )
    }

    /**
     * Builds a search query result item using a placement, type, and ID
     * 
     * @param {number} placement 
     * @param {number} type
     * @param {number} id 
     * @param {number} distance
     * @returns {SearchQueryResultItem} The built result item
     */
    #buildSearchQueryResultItem(
        placement,
        type,
        id,
        distance
    ) {
        type = SearchQueryResultItemType.values[type]
        return new SearchQueryResultItem(
            placement,
            type,
            type == SearchQueryResultItemType.Song ? this.#getSongSync(id, true) : this.#getArtistSync(id, true),
            distance
        )
    }

    /**
     * Converts the complex SearchQueryParams object into a plain object for use with the database.
     * 
     * @param {SearchQueryParams} complexParams 
     * @returns {Object}
     */
    #getSearchQueryPlainParams(
        complexParams
    ) {
        return {
            query: complexParams.query,
            maxEntries: complexParams.maxEntries,
            startAt: complexParams.startAt,
            minimumDistance: complexParams.minimumDistance,
            maximumDistance: complexParams.maximumDistance
        }
    }

    /**
     * Synchronously performs a search query based on the provided parameters.
     * Returns a SearchQueryResult with the raw search query result.
     * 
     * @param {Object} params The plain parameters to perform this query with.
     * @returns {Object[]} The raw search query result.
     */
    #searchQueryRawSync(
        params
    ) {
        return this.db.prepare(`
        SELECT DISTINCT 0 AS type,
            song_id AS id,
            (CASE WHEN name LIKE '%' || :query || '%'
                THEN 0
                ELSE editdist3(lower(:query), lower(name)) END) AS distance
        FROM songs_names
        WHERE distance >= :minimumDistance
            AND distance <= :maximumDistance
        UNION
        SELECT DISTINCT 1 AS type,
            artist_id AS id, 
            (CASE WHEN name LIKE '%' || :query || '%'
                THEN 0
                ELSE editdist3(lower(:query), lower(name)) END) AS distance
        FROM artists_names
        WHERE distance >= :minimumDistance
            AND distance <= :maximumDistance
        ORDER BY distance ASC 
        LIMIT :maxEntries
        OFFSET :startAt`).all(params)
    }

    /**
     * Calculates and returns the total possible number of results that a search query with the provided parameters can return.
     * 
     * @param {Object} params The plain parameters to perform this query with.
     * @returns {number} The number of possible results.
     */
    #getSearchQueryCountSync(
        params
    ) {
        return this.db.prepare(`
        SELECT COUNT(DISTINCT song_id) AS count,
            (CASE WHEN name LIKE '%' || :query || '%'
                THEN 0
                ELSE editdist3(lower(:query), lower(name)) END) AS distance
        FROM songs_names
        WHERE distance >= :minimumDistance
            AND distance <= :maximumDistance
        UNION
        SELECT COUNT(DISTINCT artist_id) AS count,
            (CASE WHEN name LIKE '%' || :query || '%'
                THEN 0
                ELSE editdist3(lower(:query), lower(name)) END) AS distance
        FROM artists_names
        WHERE distance >= :minimumDistance
            AND distance <= :maximumDistance`).get(params)?.count || 0
    }

    /**
     * Synchronously performs a search query based on the provided parameters.
     * Returns a SearchQueryResult with the search query result.
     * 
     * @param {SearchQueryParams} params The parameters to perform this query with.
     * @returns {SearchQueryResult} The search query result.
     */
    #searchQuerySync(
        params
    ) {
        const plainParams = this.#getSearchQueryPlainParams(params)
        const rawResults = this.#searchQueryRawSync(plainParams)

        const results = []

        for (const [n, searchResultData] of rawResults.entries()) {
            results.push(this.#buildSearchQueryResultItem(
                n + params.startAt,
                searchResultData.type,
                searchResultData.id,
                searchResultData.distance
            ))
        }

        return new SearchQueryResult(
            this.#getSearchQueryCountSync(plainParams),
            results
        )
    }

    /**
     * Deletes a song from the database with the specified id.
     * 
     * @param {number} songId The id of the song to delete.
     */
    #deleteSongSync(
        songId
    ) {
        this.db.prepare(`
        DELETE FROM songs
        WHERE id = ?`).run(songId)
    }

    /**
     * Deletes an artist from the database with a specified id.
     * 
     * @param {number} artistId The id of the artist to delete.
     */
    #deleteArtistSync(
        artistId
    ) {
        this.db.prepare(`
        DELETE FROM artists
        WHERE id = ?`).run(artistId)
    }

    /**
     * Gets every artist that has its base artist id equal to the provided artistId.
     * 
     * @param {number} artistId The artist id to get the children of.
     * @returns {Promise<Artist[]|Error>} The list of children.
     */
    getArtistChildren(artistId) {
        return new Promise((resolve, reject) => {
            try {
                resolve(this.#getArtistChildrenSync(artistId))
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * Checks if a song exists within the database.
     * 
     * @param {number} id The ID of the song to check the existence of.
     * @returns {Promise<Boolean>} A promise that resolves upon the completion of this function.
     */
    songExists(id) {
        return new Promise((resolve, reject) => {
            try {
                resolve(this.db.prepare('SELECT id FROM songs WHERE id = ? LIMIT 1').get(id) ? true : false)
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * Checks if a artist exists within the database.
     * 
     * @param {number} id The ID of the artist to check the existence of.
     * @returns {Promise<Boolean>} A promise that resolves upon the completion of this function.
     */
    artistExists(id) {
        return new Promise((resolve, reject) => {
            try {
                resolve(this.db.prepare('SELECT id FROM artists WHERE id = ? LIMIT 1').get(id) ? true : false)
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * Checks if the provided timestamp exists within the database.
     * 
     * @param {string} timestamp The timestamp to check the existence of.
     * @returns {Promise<Boolean>} A promise that resolves with the result of this function.
     */
    viewsTimestampExists(timestamp) {
        return new Promise((resolve, reject) => {
            try {
                resolve(this.#timestampExistsSync(timestamp))
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * Gets every timestamp within the database.
     * 
     * @returns {Promise<Object[]>} A promise that resolves with the result of this function.
     */
    getViewsTimestamps() {
        return new Promise((resolve, reject) => {
            try {
                resolve(this.#getViewsTimestamps())
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * Asynchronously gets the most recent views timestamp.
     * 
     * @returns {Promise<string=>} A promise that resolves with the most recent timestamp or undefined if not timestamp exists.
     */
    getMostRecentViewsTimestamp() {
        return new Promise((resolve, reject) => {
            try {
                resolve(this.#getMostRecentViewsTimestampSync())
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * Asynchronously filters rankings and returns the filtered rankings entries.
     * 
     * @param {RankingsFilterParams} filterParams The parameters to filter by.
     * @returns {RankingsFilterResultItem[]} The filtered rankings entries.
     */
    filterRankings(filterParams) {
        return new Promise((resolve, reject) => {
            try {
                resolve(this.#filterRankingsSync(filterParams))
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * Asynchronously filters artists rankings and returns the filtered artists rankings entires.
     * @param {ArtistsRankingsFilterParams} filterParams The parameters to filter by.
     * @returns {ArtistsRankingsFilterResultItem[]} The filtered rankings entries.
     */
    filterArtistsRankings(filterParams) {
        return new Promise((resolve, reject) => {
            try {
                resolve(this.#filterArtistsRankingsSync(filterParams))
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * Gets an artists's historical views.
     * 
     * @param {number} id The id of the artists to get the historical views data of.
     * @param {number} [range] In days. The number of days in the past to get the historical data of.
     * @param {number} [period] In days. The amount of days between each entry.
     * @param {string} [timestamp] The timestamp to start getting the historical data from.
     * @returns {HistoricalViews[]} An array of HistoricalViews objects depicting the historical views of this artists.
     */
    getArtistHistoricalViews(
        id,
        range,
        period,
        timestamp
    ) {
        return new Promise((resolve, reject) => {
            try {
                resolve(this.#getArtistHistoricalViewsSync(
                    id,
                    range,
                    period,
                    timestamp
                ))
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * Gets a song's historical views.
     * 
     * @param {number} id The id of the song to get the historical views data of.
     * @param {number} [range] In days. The number of days in the past to get the historical data of.
     * @param {number} [period] In days. The amount of days between each entry.
     * @param {string} [timestamp] The timestamp to start getting the historical data from.
     * @returns {HistoricalViews[]} An array of HistoricalViews objects depicting the historical views of this song.
     */
    getSongHistoricalViews(
        id,
        range,
        period,
        timestamp
    ) {
        return new Promise((resolve, reject) => {
            try {
                resolve(this.#getSongHistoricalViewsSync(id, range, period, timestamp))
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * Performs a search query using the provided SearchQueryParams and returns the resulting SearchQueryResult.
     * 
     * @param {SearchQueryParams} params 
     * @returns {SearchQueryResult}
     */
    searchQuery(
        params
    ) {
        return new Promise((resolve, reject) => {
            try {
                resolve(this.#searchQuerySync(params))
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * Asynchronously gets a song from the database.
     * Returns null if no song was found.
     * 
     * @param {number} id The id of the song to get.
     * @returns {Promise<Song|null>} A promise that resolves with a Song or null.
     */
    getSong(id) {
        return new Promise((resolve, reject) => {
            try {
                resolve(this.#getSongSync(id))
            } catch (error) {
                reject(error)
            }
        })
    }

    getSongsIds() {
        return new Promise((resolve, reject) => {
            try {
                resolve(this.db.prepare('SELECT id FROM songs').all())
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * Asynchronously gets an artist from the database.
     * Returns nulls if no artist was found.
     * 
     * @param id The id of the artist to get.
     * @returns {Promise<Artist|null>} A promise that resolves with an Artist or null.
     */
    getArtist(id) {
        return new Promise((resolve, reject) => {
            try {
                resolve(this.#getArtistSync(id, true))
            } catch (error) {
                reject(error)
            }
        })
    }

    // delete functions

    /**
     * Deletes a song from the database with a specified id.
     * 
     * @param {number} songId The id of the song to delete.
     * @returns {Promise<null>}
     */
    deleteSong(
        songId
    ) {
        return new Promise((resolve, reject) => {
            try {
                resolve(this.#deleteSongSync(songId))
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * Deletes an artist from the database with a specified id.
     * 
     * @param {number} artistId The id of the artist to delete.
     * @returns {Promise<null>}
     */
    deleteArtist(
        artistId
    ) {
        return new Promise((resolve, reject) => {
            try {
                resolve(this.#deleteArtistSync(artistId))
            } catch (error) {
                reject(error)
            }
        })
    }

    // insert functions

    /**
     * Inserts an artist into the database.
     * 
     * @param {Artist} artist The artist to insert.
     * @returns {Promise} A promise that resolves upon the artist being inserted.
     */
    insertArtist(artist) {
        return new Promise(async (resolve, reject) => {
            try {

                const db = this.db
                const artistId = artist.id

                // prepare statement to insert into artists
                const artistsInsertStatement = db.prepare(`
                REPLACE INTO artists (id, artist_type, publish_date, addition_date, base_artist_id, average_color, dark_color, light_color)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
                // prepare statement to insert into artists names
                const artistsNamesInsertStatement = db.prepare(`
                REPLACE INTO artists_names (artist_id, name, name_type)
                VALUES (?, ?, ?)`)
                // prepare statement to insert into artists thumbnails
                const artistsThumnailsInsertStatement = db.prepare(`
                REPLACE INTO artists_thumbnails (thumbnail_type, url, artist_id)
                VALUES (?, ?, ?)`)

                // handle base artist
                // insert the base artist if it doesn't exist within the database
                const baseArtist = artist.baseArtist
                const baseArtistId = baseArtist ? baseArtist.id : null
                if (baseArtistId && !(await this.artistExists(baseArtistId))) {
                    await this.insertArtist(baseArtist)
                }

                // insert artist into artists
                artistsInsertStatement.run(
                    artistId,
                    artist.type.id,
                    artist.publishDate,
                    artist.additionDate,
                    baseArtistId,
                    artist.averageColor,
                    artist.darkColor,
                    artist.lightColor
                )
                // insert names
                for (const [nameType, name] of Object.entries(artist.names)) {
                    if (name != undefined) {
                        artistsNamesInsertStatement.run(
                            artistId,
                            name,
                            nameType
                        )
                    }
                }
                // insert thumbnails
                for (const [thumbnailType, thumbnail] of Object.entries(artist.thumbnails)) {
                    artistsThumnailsInsertStatement.run(
                        thumbnailType,
                        thumbnail.url,
                        artistId
                    )
                }
                resolve()
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * Internal function that inserts the values of a song into the song's foreign tables.
     * 
     * @param {Song} song
     * @returns {Promise} A promise that resolves when this task completes.
     */
    #insertSongForeign(song) {
        return new Promise(async (resolve, reject) => {
            try {
                const db = this.db
                const songId = song.id

                // prepare statement to insert into songs artists
                const songsArtistsInsertStatement = db.prepare(`
                REPLACE INTO songs_artists (song_id, artist_id, artist_category)
                VALUES (?, ?, ?)`)

                // prepare statement to insert into songs names
                const songsNamesInsertStatement = db.prepare(`
                REPLACE INTO songs_names (song_id, name, name_type)
                VALUES (?, ?, ?)`)

                // prepare statement to insert into songs video ids
                const songsVideoIdsInsertStatement = db.prepare(`
                REPLACE INTO songs_video_ids (song_id, video_id, video_type)
                VALUES (?, ?, ?)`)

                // insert artists into song artists table
                for (const [_, artist] of song.artists.entries()) {
                    const artistId = artist.id
                    if (!(await this.artistExists(artistId))) {
                        await this.insertArtist(artist)
                    }
                    const category = artist.category
                    songsArtistsInsertStatement.run(
                        songId,
                        artistId,
                        category ? category.id : 0
                    )
                }

                // insert names into songs names table
                for (const [nameType, name] of song.names.entries()) {
                    if (name != undefined) {
                        songsNamesInsertStatement.run(
                            songId,
                            name,
                            nameType
                        )
                    }
                }

                // insert video ids into songs video ids table
                for (const [viewType, bucket] of song.videoIds.entries()) {
                    if (bucket != undefined) {
                        for (const [_, videoId] of bucket.entries()) {
                            songsVideoIdsInsertStatement.run(
                                songId,
                                videoId,
                                viewType
                            )
                        }
                    }
                }
                resolve()
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * Updates the provided song.
     * 
     * @param {Song} song The song to update.
     * @returns {Promise} A promise that resolves when the song is updated.
     */
    updateSong(song) {
        return new Promise(async (resolve, reject) => {
            try {
                if (!song || song == undefined) {
                    return reject('undefined song provided to updateSong.')
                }

                const db = this.db
                const songId = song.id

                const existingSong = this.#getSongSync(songId, false)
                if (!existingSong) {
                    return reject("Attemp to update a song that doesn't exist.")
                }

                // prepare statement to update into songs
                const songsUpdateStatement = db.prepare(`
                UPDATE songs
                SET publish_date = ?,
                    song_type = ?,
                    thumbnail = ?,
                    maxres_thumbnail = ?,
                    thumbnail_type = ?,
                    average_color = ?,
                    dark_color = ?,
                    light_color = ?,
                    fandom_url = ?
                WHERE id = ?`)

                // delete songs artists
                db.prepare(`
                    DELETE FROM songs_artists
                    WHERE song_id = ?
                `).run(songId)

                // delete songs names
                db.prepare(`
                    DELETE FROM songs_names
                    WHERE song_id = ?
                `).run(songId)

                // delete song video ids
                db.prepare(`
                    DELETE FROM songs_video_ids
                    WHERE song_id = ?
                `).run(songId)

                songsUpdateStatement.run(
                    song.publishDate,
                    song.type.id,
                    song.thumbnail,
                    song.maxresThumbnail,
                    song.thumbnailType.id,
                    song.averageColor,
                    song.darkColor,
                    song.lightColor,
                    song.fandomUrl,
                    songId
                )

                await this.#insertSongForeign(song)
                resolve()
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * Inserts a new song into the database
     * 
     * @param {Song} song The song to insert.
     * @returns {Promise} A promise that resolves upon the completion of this function.
     */
    insertSong(song) {
        return new Promise(async (resolve, reject) => {
            try {
                if (!song || song == undefined) {
                    return reject('undefined song provided to insertSong.')
                }
                const db = this.db

                const songId = song.id

                // check if the song already exists
                const existingSong = this.#getSongSync(songId, false)
                if (existingSong) {
                    return reject(`The song with id "${songId}" already exists within the database.`)
                }

                // insert into songs table
                db.prepare(`
                REPLACE INTO songs (id, publish_date, addition_date, song_type, thumbnail, maxres_thumbnail, thumbnail_type, average_color, dark_color, light_color, fandom_url)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
                    songId,
                    song.publishDate,
                    song.additionDate,
                    song.type.id,
                    song.thumbnail,
                    song.maxresThumbnail,
                    song.thumbnailType.id,
                    song.averageColor,
                    song.darkColor,
                    song.lightColor,
                    song.fandomUrl
                )

                // insert foreign tables
                await this.#insertSongForeign(song)

                // insert views
                const views = song.views
                if (views) {
                    await this.insertSongViews(songId, views)
                }

                resolve()
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * Inserts a new views timestamp into the views metadata table.
     * 
     * @param {string} timestamp The timestamp to insert into the views metadata.
     * @param {string} [updated] When this timestamp was last updated.
     * @returns {Promise} A promise that resolves upon insertion completion.
     */
    insertViewsTimestamp(timestamp, updated) {
        return new Promise((resolve, reject) => {
            try {
                resolve(this.db.prepare(`
                REPLACE INTO views_metadata (timestamp, updated)
                VALUES (?, ?)`).run(
                    timestamp,
                    updated || generateISOTimestamp()
                ))
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * Inserts a song's views into the database.
     * 
     * @param {Number} songId The id of the song to insert the views of.
     * @param {EntityViews} songViews The views to insert into the database.
     * @returns {Promise} A promise that resolves upon insertion completion.
     */
    insertSongViews(
        songId,
        songViews
    ) {
        return new Promise(async (resolve, reject) => {
            try {
                const db = this.db
                // get the timestamp
                let timestamp = songViews.timestamp || this.#getMostRecentViewsTimestampSync()
                if (!timestamp) {
                    // generate a new timestamp
                    timestamp = generateTimestamp().Name
                    await this.insertViewsTimestamp(timestamp)
                }

                // prepare the views totals replace statement
                const viewsTotalsReplaceStatement = db.prepare(`
                REPLACE INTO views_totals (song_id, timestamp, total)
                VALUES (?, ?, ?)`)

                const viewsBreakdownsReplaceStatement = db.prepare(`
                REPLACE INTO views_breakdowns (song_id, timestamp, views, video_id, view_type)
                VALUES (?, ?, ?, ?, ?)`)

                viewsTotalsReplaceStatement.run(
                    songId,
                    timestamp,
                    songViews.total,
                )

                // insert breakdowns
                for (const [viewType, viewsBucket] of songViews.breakdown.entries()) {
                    if (viewsBucket) {
                        for (const [_, videoViews] of viewsBucket.entries()) {
                            viewsBreakdownsReplaceStatement.run(
                                songId,
                                timestamp,
                                videoViews.views,
                                videoViews.id,
                                viewType
                            )
                        }
                    }
                }
                resolve()
            } catch (error) {
                reject(error)
            }
        })
    }
}