const workingDirectory = process.cwd()
const modulePath = workingDirectory + "/server_scripts"

// import
const NameType = require(workingDirectory + "/db/enums/NameType")
const database = require(workingDirectory + "/db")
const songsDataDb = database.songsDataProxy

// import modules
const { argbFromHex, themeFromSourceColor, hexFromArgb, redFromArgb, greenFromArgb, blueFromArgb } = require("@importantimport/material-color-utilities");
const ArtistCategory = require("../../../db/enums/ArtistCategory")
const RankingsFilterParams = require("../../../db/dataClasses/RankingsFilterParams")
const { getHasherAsync, viewTypesDisplayData, caches } = require(modulePath + "/shared")
const { getPreferredLanguageName } = require(modulePath + "/locale")

// load cache
const artistsDataCache = caches.artistsDataCache

// functions
const getRgbMdTokenFromArgb = (argb, suffix = '') => {
    return `--md-sys-color-${suffix}-rgb: ${redFromArgb(argb)} ${greenFromArgb(argb)} ${blueFromArgb(argb)};`
}

const getCustomThemeStylesheet = (theme, suffix = "", key = "") => {

    const cacheKey = `${key}${suffix}`
    {
        const cached = artistsDataCache.get(cacheKey)
        if (cached) {
            return cached.getData()
        }
    }

    const lines = []

    for (const [key, argb] of Object.entries(theme)) {
        const token = key.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
        const color = hexFromArgb(argb);
        lines.push(`--md-sys-color-${token}-${suffix}: ${color} !important;`)
    }

    // add primary rgb values
    const primary = theme['primary']
    if (primary) {
        lines.push(getRgbMdTokenFromArgb(primary, "primary-" + suffix))
    }
    // add bg rgb values
    const background = theme['background']
    if (background) {
        lines.push(getRgbMdTokenFromArgb(background, "background-" + suffix))
    }

    artistsDataCache.set(cacheKey, lines)

    return lines

}

const queryArtist = (artistIdString, options) => {
    return new Promise(async (resolve, reject) => {
        try {

            const queryHash = artistIdString + (await getHasherAsync())(JSON.stringify(options))
            {
                // check for cache
                const cachedData = artistsDataCache.get(queryHash)
                if (cachedData) {
                    return resolve(cachedData.getData())
                }
            }

            // generate data
            const artistId = Number.parseInt(artistIdString)

            songsDataDb.getArtist(artistId)
                .then(async artistData => {
                    if (!artistData) {
                        return reject(new Error(`Artist with id '${artistId}' does not exist.`))
                    }

                    const preferredLanguage = options.preferredLanguage || NameType.Original

                    const getPreferredName = (names) => {
                        return getPreferredLanguageName(names, preferredLanguage)
                    }

                    // set preferred name
                    artistData.preferredName = getPreferredName(artistData.names)

                    // get base artist if it exists
                    const baseArtist = artistData.baseArtist
                    if (baseArtist) {
                        baseArtist.preferredName = getPreferredName(baseArtist.names)
                    }

                    // get similar voicebanks
                    const children = (await songsDataDb.getArtistChildren(artistId)
                        .then(children => {
                            const localized = []
                            children.forEach(child => {
                                if (child.id != artistId) {
                                    child.preferredName = getPreferredName(child.names)
                                    localized.push(child)
                                }
                            })
                            return localized
                        })
                        .catch(error => reject(error))) || []
                    artistData.children = children.length == 0 ? null : children

                    // get breakdown
                    const breakdown = []
                    {
                        const artistViews = artistData.views
                        const totalViews = artistViews.total

                        for (const [typeId, breakdowns] of Object.entries(artistViews.breakdown)) {
                            const displayData = viewTypesDisplayData[typeId]

                            const views = breakdowns[0].views
                            breakdown.push({
                                views: views,
                                share: views / totalViews,
                                color: displayData.colors[0],
                                displayData: displayData
                            })
                        }

                        breakdown.sort((a, b) => {
                            return b.views - a.views
                        })
                        artistData.displayBreakdown = breakdown
                    }
                    // get historical views
                    {
                        const historicalViews = await songsDataDb.getArtistHistoricalViews(artistId)

                        highestViews = 0
                        historicalViews.forEach(entry => {
                            const date = new Date(entry.timestamp)

                            const dateString = `${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getDate().toString().padStart(2, "0")}`

                            highestViews = Math.max(highestViews, entry.views)

                            entry.dateString = dateString
                        })
                        //calculate share
                        historicalViews.forEach(entry => {
                            entry.share = entry.views / highestViews
                        })

                        artistData.historicalViews = historicalViews
                    }
                    // get top 10 songs
                    {
                        const params = new RankingsFilterParams()
                        params.artists = [artistId]
                        params.maxEntries = 9
                        const dbResponse = await songsDataDb.filterRankings(params)
                        const totalCount = dbResponse.totalCount
                        const topTen = dbResponse?.results || []

                        topTen.forEach(resultItem => {
                            resultItem.preferredName = getPreferredName(resultItem.song.names)
                        })
                        artistData.songsOne = topTen.slice(0, 5)
                        if (dbResponse.totalCount >= 10) {
                            artistData.moreSongs = true
                        }
                        if (totalCount > 5) {
                            artistData.songsTwo = topTen.slice(5, 10)
                        }
                    }

                    // cache return data
                    artistsDataCache.set(queryHash, artistData)

                    resolve(artistData)
                })
                .catch(error => reject(error))

        } catch (error) {
            reject(error)
        }
    })
}

// route functions
const getArtist = async (request, reply) => {
    const parsedCookies = request.parsedCookies || {}
    
    // get artist id
    const artistId = request.params.artistId
    if (!artistId) {
        return reply.send({
            code: 400,
            message: "Invalid parameters provided",
        })
    }
    // add artist id to handlebars params
    request.addHbParam('id', artistId)

    // get the artist data
    await queryArtist(artistId, {
        preferredLanguage: NameType.fromId(parsedCookies.titleLanguage),
    })
        .then(artistData => {
            request.addHbParam('artistData', artistData)
            // add page name
            request.addHbParam('pageTitle', artistData.preferredName)

            // load custom theme 
            {
                const theme = themeFromSourceColor(argbFromHex(artistData.averageColor));

                const schemes = theme.schemes
                request.addHbParam('customTheme', getCustomThemeStylesheet(schemes.light.props, "light", artistId).join('') + getCustomThemeStylesheet(schemes.dark.props, "dark", artistId).join(''))
            }

            // load artist names
            {
                const artistNames = []
                for (const [id, name] of artistData.names.entries()) {
                    if (name) {
                        artistNames.push({
                            name: NameType.fromId(id).name,
                            value: name
                        })
                    }
                }
                request.addHbParam('displayNames', artistNames)
            }

            // get placement display data
            {
                const isVocalist = artistData.category == ArtistCategory.Vocalist
                const displayPlacements = []

                // all time
                {
                    const allTimePlacement = artistData.placement.allTime
                    const toFormat = isVocalist ? "#:placement Most Viewed Singer All Time" : "#:placement Most Viewed Producer All Time"
                    displayPlacements.push({
                        type: "views",
                        url: `/rankings/filter/set?artistCategory=${artistData.category.id}&startAt=${allTimePlacement - 1}&referer=/rankings/${isVocalist ? 'singers' : 'producers'}`,
                        text: toFormat.replace(':placement', allTimePlacement)
                    })
                }
                request.addHbParam('displayPlacements', displayPlacements)
            }

            return reply.view("pages/artist.hbs", request.hbParams)
        })
        .catch(error => {
            return reply.status(400).send({
                code: 400,
                message: error.message
            })
        })
}


// exports
exports.prefix = "/artist"

exports.register = (fastify, options, done) => {
    fastify.get("/:artistId", {
        config: {
            analyticsEvent: "page_visit",
            analyticsParams: { 'page_name': "" }
        },
    }, getArtist)

    done();
}