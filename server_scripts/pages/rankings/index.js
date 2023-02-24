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
        displayName: "Date",
        defaultValue: null,
        getValueAsync: (rawValue) => {
            return [rawValue]
        }
    },
    'timePeriodOffset': {
        displayName: "Time Period",
        defaultValue: null,
        getValueAsync: (rawValue) => {
            return [rawValue]
        }
    },
    'viewType': {
        displayName: "View Type",
        defaultValue: null,
        getValueAsync: (rawValue) => {
            return [rawValue.name]
        }
    },
    'songType': {
        displayName: "Song Type",
        defaultValue: null,
        getValueAsync: (rawValue) => {
            return [rawValue.name]
        }
    },
    'artistType': {
        displayName: "Artist Type",
        defaultValue: null,
        getValueAsync: (rawValue) => {
            return [rawValue.name]
        }
    },
    'publishDate': {
        displayName: "Publish Date",
        defaultValue: null,
        getValueAsync: (rawValue) => {
            return [rawValue]
        }
    },
    'orderBy': {
        displayName: "Order By",
        defaultValue: FilterOrder.Views,
        getValueAsync: (rawValue) => {
            return [rawValue.name]
        }
    },
    'direction': {
        displayName: "Direction",
        defaultValue: FilterDirection.Descending,
        getValueAsync: (rawValue) => {
            return [rawValue.name]
        }
    },
    'artists': {
        displayName: 'Artists',
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
        displayName: 'View Type',
        name: "viewType",
        isChip: true,
        default: 0,
        values: [
            { name: 'Combined', value: null },
            { name: 'YouTube', value: ViewType.YouTube.id },
            { name: 'Niconico', value: ViewType.Niconico.id },
            { name: 'bilibili', value: ViewType.bilibili.id }
        ]
    },
    {
        displayName: 'Time Period',
        name: "timePeriodOffset",
        isChip: true,
        default: 0,
        values: [
            { name: 'All Time', value: null },
            { name: 'Past Day', value: 1 },
            { name: 'Past Week', value: 7 },
            { name: 'Past Month', value: 30 }
        ]
    },
    {
        displayName: 'Direction',
        name: "direction",
        isChip: true,
        default: 0,
        values: [
            { name: 'Descending', value: FilterDirection.Descending.id },
            { name: 'Ascending', value: FilterDirection.Ascending.id }
        ]
    },
    {
        displayName: 'Order By',
        name: "orderBy",
        isChip: true,
        default: 0,
        values: [
            { name: 'Views', value: FilterOrder.Views.id },
            { name: 'Publish Date', value: FilterOrder.PublishDate.id },
            { name: 'Addition Date', value: FilterOrder.AdditionDate.id }
        ]
    },
    {
        displayName: "Song Type",
        name: "songType",
        isChip: true,
        default: 0,
        values: [
            { name: 'All', value: null },
            { name: 'Original', value: SongType.Original.id },
            { name: 'Remix', value: SongType.Remix.id },
            { name: 'Other', value: SongType.Other.id }
        ]
    },
    {
        displayName: "Artist Type",
        name: "artistType",
        isSelect: true,
        default: 0,
        values: [
            { name: 'All', value: null },
            { name: 'Vocaloid', value: ArtistType.Vocaloid.id },
            { name: 'CeVIO', value: ArtistType.CeVIO.id },
            { name: 'SynthesizerV', value: ArtistType.SynthesizerV.id },
            { name: 'Illustrator', value: ArtistType.Illustrator.id },
            { name: 'Cover Artist', value: ArtistType.CoverArtist.id },
            { name: 'Animator', value: ArtistType.Animator.id },
            { name: 'Producer', value: ArtistType.Producer.id },
            { name: 'Other Vocalist', value: ArtistType.OtherVocalist.id },
            { name: 'Other Voice Synthesizer', value: ArtistType.OtherVoiceSynthesizer.id },
            { name: 'Other Individual', value: ArtistType.OtherIndividual.id },
            { name: 'Other Group', value: ArtistType.OtherGroup.id }
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

    return reply.view("pages/filterRankings.hbs", {
        seo: request.seo,
        cookies: parsedCookies,
        filterValues: filterValues,
        pageTitle: "Filter Rankings",
        minimumDate: viewsTimestamps[viewsTimestamps.length - 1].timestamp,
        defaultDate: query['timestamp'] || maximumDate,
        maximumDate: maximumDate
    });
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
    const hbParams = { // params for handlebars
        seo: request.seo,
        cookies: parsedCookies
    }

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
        preferredLanguage: NameType.Romaji
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
            preferredLanguage: NameType.Romaji
        })
    }

    return reply.view("pages/rankingsV2.hbs", hbParams);
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
    fastify.get("/filter/remove", getRemoveFilter)
    fastify.get("/filter/remove-all", getRemoveAllFilters)
    done();
}