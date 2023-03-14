const workingDirectory = process.cwd()
const modulePath = workingDirectory + "/server_scripts/"

const { getAverageColor } = require("fast-average-color-node")

const RankingsFilterParams = require("../../../db/dataClasses/RankingsFilterParams")
const FilterDirection = require("../../../db/enums/FilterDirection")
const FilterOrder = require("../../../db/enums/FilterOrder")
const RankingsFilterResult = require("../../../db/dataClasses/RankingsFilterResult")
const NameType = require("../../../db/enums/NameType")
const ArtistCategory = require("../../../db/enums/ArtistCategory")
const SongType = require("../../../db/enums/SongType")
const ViewType = require("../../../db/enums/ViewType")
const ArtistType = require("../../../db/enums/ArtistType")
const { PublishDate } = require("../../../db/enums/FilterOrder")
const TitleLanguageSetting = require("../settings/enums/TitleLanguageSetting")

const database = require(workingDirectory + "/db")
const databaseProxy = require(modulePath + "/database")

const { longFormat } = require(modulePath + "/unitConverter")
const { viewTypes, getHasherAsync, caches, rankingsFilterQueryTemplate, getRandomInt, generateTimestamp } = require(modulePath + "shared") // shared functions
const { getPreferredLanguageName } = require(modulePath + "/locale")

// implement caches
const rankingsCache = caches.rankingsCache // initialize rankings cache with a lifespan of 1 hour
const queryCache = caches.queryCache // gets the query cache with a lifespan of 1 hour
const highlightsCache = caches.highlightsCache // gets the highlights cache with a lifespan of 1 hour

const filterParamsDisplayData = {
    'timestamp': {
        displayName: "filter_timestamp",
        defaultValue: null,
        getValueAsync: (rawValue) => {
            return [rawValue]
        }
    },
    'timePeriodOffset': {
        displayName: "filter_time_period_offset",
        defaultValue: null,
        getValueAsync: (rawValue) => {
            switch (rawValue) {
                case 1:
                    return ["Past Day"]
                case 7:
                    return ['Past Week']
                case 30:
                    return ['Past Month']
                default:
                    return [`Past ${rawValue} Days`]
            }
        }
    },
    'viewType': {
        displayName: "filter_view_type",
        defaultValue: null,
        getValueAsync: (rawValue) => {
            return [rawValue.name]
        }
    },
    'songType': {
        displayName: "filter_song_type",
        defaultValue: null,
        getValueAsync: (rawValue) => {
            return [rawValue.name]
        }
    },
    'artistType': {
        displayName: "filter_artist_type",
        defaultValue: null,
        getValueAsync: (rawValue) => {
            return [rawValue.name]
        }
    },
    'publishDate': {
        displayName: "filter_publish_date",
        defaultValue: null,
        getValueAsync: (rawValue) => {
            return [rawValue]
        }
    },
    'orderBy': {
        displayName: "filter_order_by",
        defaultValue: FilterOrder.Views,
        getValueAsync: (rawValue) => {
            return [rawValue.name]
        }
    },
    'singleVideo': {
        displayName: "filter_single_video",
        defaultValue: null,
        getValueAsync: (rawValue) => {
            return [rawValue == 1 ? "filter_single_video_single" : "filter_single_video_all"]
        }
    },
    'direction': {
        displayName: "filter_direction",
        defaultValue: FilterDirection.Descending,
        getValueAsync: (rawValue) => {
            return [rawValue.name]
        }
    },
    'artists': {
        displayName: 'filter_artists',
        defaultValue: null,
        getValueAsync: async (rawValue, options) => {
            const preferredLanguage = options.preferredLanguage || NameType.Original

            const artistNames = []
            const getPreferredName = (names) => {
                return getPreferredLanguageName(names, preferredLanguage)
            }

            for (const [_, artistId] of rawValue.entries()) {
                const artist = await database.songsData.getArtist(artistId)
                if (artist) {
                    artistNames.push(getPreferredName(artist.names))
                }
            }

            return artistNames
        }
    },
}

const filterPageOptions = [
    {
        displayName: 'filter_view_type',
        name: "viewType",
        isChip: true,
        default: 0,
        values: [
            { name: 'filter_view_type_combined', value: null },
            { name: 'youtube', value: ViewType.YouTube.id },
            { name: 'niconico', value: ViewType.Niconico.id },
            { name: 'bilibili', value: ViewType.bilibili.id }
        ]
    },
    {
        displayName: 'filter_time_period_offset',
        name: "timePeriodOffset",
        isChip: true,
        default: 0,
        values: [
            { name: 'filter_time_period_offset_all_time', value: null },
            { name: 'filter_time_period_offset_day', value: 1 },
            { name: 'filter_time_period_offset_week', value: 7 },
            { name: 'filter_time_period_offset_month', value: 30 }
        ]
    },
    {
        displayName: 'filter_direction',
        name: "direction",
        isChip: true,
        default: 0,
        values: [
            { name: 'filter_direction_descending', value: FilterDirection.Descending.id },
            { name: 'filter_direction_ascending', value: FilterDirection.Ascending.id }
        ]
    },
    {
        displayName: 'filter_order_by',
        name: "orderBy",
        isChip: true,
        default: 0,
        values: [
            { name: 'filter_order_by_views', value: FilterOrder.Views.id },
            { name: 'filter_order_by_publish', value: FilterOrder.PublishDate.id },
            { name: 'filter_order_by_addition', value: FilterOrder.AdditionDate.id }
        ]
    },
    {
        displayName: 'filter_single_video',
        name: "singleVideo",
        isChip: true,
        default: 0,
        values: [
            { name: 'filter_single_video_all', value: null },
            { name: 'filter_single_video_single', value: 1 }
        ]
    },
    {
        displayName: "filter_song_type",
        name: "songType",
        isChip: true,
        default: 0,
        values: [
            { name: 'filter_song_type_all', value: null },
            { name: 'filter_song_type_original', value: SongType.Original.id },
            { name: 'filter_song_type_remix', value: SongType.Remix.id },
            { name: 'filter_song_type_other', value: SongType.Other.id }
        ]
    },
    {
        displayName: "filter_artist_type",
        name: "artistType",
        isSelect: true,
        default: 0,
        values: [
            { name: 'filter_artist_type_all', value: null },
            { name: 'filter_artist_type_vocaloid', value: ArtistType.Vocaloid.id },
            { name: 'filter_artist_type_cevio', value: ArtistType.CeVIO.id },
            { name: 'filter_artist_type_synth_v', value: ArtistType.SynthesizerV.id },
            { name: 'filter_artist_type_illustrator', value: ArtistType.Illustrator.id },
            { name: 'filter_artist_type_cover_artist', value: ArtistType.CoverArtist.id },
            { name: 'filter_artist_type_animator', value: ArtistType.Animator.id },
            { name: 'filter_artist_type_producer', value: ArtistType.Producer.id },
            { name: 'filter_artist_type_other_vocalist', value: ArtistType.OtherVocalist.id },
            { name: 'filter_artist_type_other_voice_synth', value: ArtistType.OtherVoiceSynthesizer.id },
            { name: 'filter_artist_type_other_individual', value: ArtistType.OtherIndividual.id },
            { name: 'filter_artist_type_other_group', value: ArtistType.OtherGroup.id }
        ]
    },
]

/**
 * Turns a fastify request.query object into a filterParams object for rankings querying
 * 
 * @param {Object<string, string>} query The query to turn into a filter params.
 */
const buildFilterParamsAsync = (query) => {
    return new Promise(async (resolve, reject) => {
        try {
            // calculate the hash
            const hash = (await getHasherAsync())(JSON.stringify(query))
            {
                // check if we already have this filter param cached
                const cached = queryCache.get(hash)
                if (cached) {
                    resolve(cached.getData())
                    return
                }
            }

            // parse artists
            var artists = null
            const queryArtists = query.artists
            if (queryArtists) {
                artists = []
                queryArtists.split(",").forEach((value) => {
                    const artistId = Number(value)
                    if (artistId) {
                        artists.push(artistId)
                    }
                })
            }

            // generate filter params
            
            const params = new RankingsFilterParams(
                query['timestamp'] || null,
                Number(query['timePeriodOffset']) || null,
                Number(query['changeOffset']) || null,
                Number(query['daysOffset']) || null,
                ViewType.values[query['viewType']],
                SongType.values[query['songType']],
                ArtistType.values[query['artistType']],
                query['publishDate'] && query.publishDate + "%" || null,
                FilterOrder.values[query['orderBy']],
                FilterDirection.values[query['direction']],
                artists,
                query['singleVideo'] ? 1 : null,
                Math.min(Number(query['maxEntries']) || 50, 50),
                Number(query['startAt'] || 0)
            )
            // add to cache
            queryCache.set(hash, params)

            // resolve
            resolve(params)
        } catch (error) {
            reject(error)
        }
    })
}

/**
 * Turns a fastify request.query object into another object for handlebars page rendering.
 * 
 * @param {Object<string, string>} query The query to turn into a filter params.
 */
const getHandlebarsDisplayFilterParamsAsync = (query, options = {}) => {
    return new Promise(async (resolve, reject) => {
        try {
            const displayData = []
            for (const [filterName, filterDisplayData] of Object.entries(filterParamsDisplayData)) {
                const defaultValue = filterDisplayData.defaultValue
                const rawFilterValue = query[filterName] || defaultValue
                if (rawFilterValue) {
                    let filterValue = await filterDisplayData.getValueAsync(rawFilterValue, options)
                    displayData.push({
                        name: filterName,
                        title: filterDisplayData.displayName,
                        value: filterValue,
                        isDefault: defaultValue == rawFilterValue
                    })
                }
            }
            resolve(displayData)
        } catch (error) {
            reject(error)
        }
    })
}

/**
 * Filters rankings and returns them.
 * 
 * @param {RankingsFilterParams} filterParams The parameters that define how the rankings are filtered.
 * @returns {RankingsFilterResult} 
 */
const filterRankingsAsync = (filterParams, options = {}) => {
    return new Promise(async (resolve, reject) => {
        try {
            const queryHash = (await getHasherAsync())(JSON.stringify({ ...filterParams, ...options }))
            {
                // check for cache
                const cachedData = rankingsCache.get(queryHash)

                if (cachedData) {

                    resolve(cachedData.getData())
                    return;

                }
            }

            /** @type {RankingsFilterResult} */
            const filtered = await database.songsData.filterRankings(filterParams)

            // add preferred names based on user language setting
            const preferredLanguage = options.preferredLanguage || NameType.Original

            const getPreferredName = (names) => {
                return getPreferredLanguageName(names, preferredLanguage)
            }

            for (const [_, rankingResult] of filtered.results.entries()) {
                const song = rankingResult.song
                rankingResult.preferredName = getPreferredName(song.names)
                // get producers
                const producers = []
                for (const [_, artist] of song.artists.entries()) {
                    if (artist.category == ArtistCategory.Producer && 3 > producers.length) {
                        artist.preferredName = getPreferredName(artist.names)
                        producers.push(artist)
                    }
                }
                rankingResult.producers = producers
            }

            // cache filtered data
            rankingsCache.set(queryHash, filtered)

            resolve(filtered)
        } catch (error) {
            reject(error)
        }
    })
}

/* request handlers */

const getFilterPage = async (request, reply) => {
    const parsedCookies = request.parsedCookies || {}

    const query = {
        ...parsedCookies.filter || {},
        ...request.query,
    }

    const filterValues = []

    for (const [_, filterOption] of filterPageOptions.entries()) {
        const name = filterOption.name
        const selectedValue = query[name] || filterOption.values[filterOption.default].value
        const values = []
        for (const [_, valueInfo] of filterOption.values.entries()) {
            const value = valueInfo.value
            values.push({
                name: valueInfo.name,
                value: value,
                isSelected: selectedValue == value
            })
        }
        filterValues.push({
            displayName: filterOption.displayName,
            name: name,
            isSelect: filterOption.isSelect,
            isChip: filterOption.isChip,
            values: values
        })
    }

    const viewsTimestamps = await database.songsData.getViewsTimestamps()

    const maximumDate = viewsTimestamps[0].timestamp

    request.addHbParams({
        ['filterValues']: filterValues,
        pageTitle: "Filter Rankings",
        minimumDate: viewsTimestamps[viewsTimestamps.length - 1].timestamp,
        defaultDate: query['timestamp'] || maximumDate,
        maximumDate: maximumDate
    })

    return reply.view("pages/filterRankings.hbs", request.hbParams);
}

const getRemoveAllFilters = async (_, reply) => {
    reply.setObjectCookie("filter", {})
    reply.redirect("/rankings")
}

const getRemoveFilter = async (request, reply) => {
    const parsedCookies = request.parsedCookies

    const query = request.query

    const filterCookie = parsedCookies.filter || {}

    for (let [filterName, filterValue] of Object.entries(filterCookie)) {
        const removable = query[filterName]

        if (removable) {
            if (filterName == "artists") {
                const artistIds = filterValue.split(',')
                const toRemoveIndex = Number(removable)
                if (toRemoveIndex != NaN) {
                    artistIds.splice(toRemoveIndex, 1)
                    filterCookie[filterName] = artistIds.join(",")
                }
            } else {
                delete filterCookie[filterName]
            }
        }

    }

    reply.setObjectCookie("filter", filterCookie)

    reply.redirect("/rankings")
}

const getSetFilter = async(request, reply) => {
    reply.setObjectCookie("filter", {})

    var newQuery = ""

    // build query again
    for (const [filterName, filterValue] of Object.entries(request.query)) {
        newQuery += `${filterName}=${filterValue}&`
    }

    reply.redirect(`/rankings/filter/add?${newQuery}`)
}

const getAddFilter = async (request, reply) => {
    const parsedCookies = request.parsedCookies

    const query = request.query
    const referer = query["referer"] || "/rankings"

    const filterCookie = parsedCookies.filter || {}

    var newQuery = ""

    const analyticsFilterNames = []
    const analyticsFilterValues = []

    for (const [filterName, filterValue] of Object.entries(query)) {
        newQuery += `${filterName}=${filterValue}&`

        filterCookie[filterName] = filterValue

        analyticsFilterNames.push(filterName)
        analyticsFilterValues.push(filterValue)
    }

    // set analytics
    {
        const params = request.routeConfig["analyticsParams"]

        params['name'] = analyticsFilterNames
        params['value'] = analyticsFilterValues
    }

    reply.setObjectCookie("filter", filterCookie)

    reply.redirect(`${referer}?${encodeURI(newQuery)}`)
}

const getRankings = async (request, reply) => {
    const parsedCookies = request.parsedCookies || {}
    const hbParams = request.hbParams

    // parse locale
    const locale = (request.headers["accept-language"] || "").split(",")[0]

    // validate query
    const requestQuery = {
        ...parsedCookies.filter || {},
        ...request.query,
    }

    // generate filter params
    const filterParams = await buildFilterParamsAsync(requestQuery)

    const filteredRankings = await filterRankingsAsync(filterParams, {
        preferredLanguage: NameType.fromId(parsedCookies.titleLanguage)
    })

    hbParams.rankings = filteredRankings.results

    // calculate pages
    {
        const listLength = filteredRankings.totalCount
        const currentPosition = filterParams.startAt
        const pageLength = filterParams.maxEntries

        const totalPages = Math.floor(listLength / pageLength)
        const currentPage = Math.ceil(currentPosition / pageLength)

        const surroundingPages = []
        const addFilterURL = "/rankings/filter/add?startAt="

        for (let i = Math.max(0, currentPage - 1); i <= Math.min(totalPages, currentPage + 1); i++) {
            surroundingPages[i] = `${addFilterURL}${i * pageLength}`
        }

        hbParams.surroundingPages = surroundingPages
        hbParams.currentPageNumber = currentPage

        // jump to last page and first page buttons
        if (currentPage - 1 > 0) {
            hbParams.firstPage = `${addFilterURL}0`
        }

        if (totalPages > currentPage + 1) {
            hbParams.lastPage = `${addFilterURL}${totalPages * pageLength}`
            hbParams.lastPageNumber = totalPages + 1
        }

        // next/previous page buttons
        if (currentPage > 0) {
            hbParams.previousPage = `${addFilterURL}${(currentPage - 1) * pageLength}`
        }
        if (totalPages > currentPage) {
            hbParams.nextPage = `${addFilterURL}${(currentPage + 1) * pageLength}`
        }
    }

    // get display filter params
    {
        hbParams.filterParams = await getHandlebarsDisplayFilterParamsAsync(filterParams, {
            preferredLanguage: NameType.fromId(parsedCookies.titleLanguage)
        })
    }

    return reply.view("pages/rankings.hbs", hbParams);
}


exports.prefix = "/rankings"

exports.register = (fastify, options, done) => {
    fastify.get("/", {
        config: {
            analyticsEvent: "page_visit",
            analyticsParams: { 'page_name': "rankings" }
        },
    }, getRankings)

    fastify.get("/filter", {
      config: {
        analyticsEvent: "page_visit",
        analyticsParams: {'page_name': "filter"}
      },
    }, getFilterPage)
    fastify.get("/filter/add", {
        config: {
            analyticsEvent: "filter_add",
            analyticsParams: { 'filter_name': [], 'filter_value': [] }
        },
    }, getAddFilter)
    fastify.get("/filter/set", {
        config: {
            analyticsEvent: "filter_set",
            analyticsParams: { 'filter_name': [], 'filter_value': [] }
        },
    }, getSetFilter)
    fastify.get("/filter/remove", getRemoveFilter)
    fastify.get("/filter/remove-all", getRemoveAllFilters)
    done();
}