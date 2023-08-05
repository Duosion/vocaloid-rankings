const workingDirectory = process.cwd()
const modulePath = workingDirectory + "/server_scripts"

// import
const NameType = require(workingDirectory + "/db/enums/NameType")
const database = require(workingDirectory + "/db")
const scraper = require(modulePath + "/scraper")
const songsDataDb = database.songsDataProxy

// import modules
const { argbFromHex, themeFromSourceColor, hexFromArgb, redFromArgb, greenFromArgb, blueFromArgb } = require("@importantimport/material-color-utilities");
const ArtistCategory = require("../../../db/enums/ArtistCategory")
const RankingsFilterParams = require("../../../db/dataClasses/RankingsFilterParams")
const AccessLevel = require("../../../db/enums/AccessLevel")
const AnalyticsEvent = require("../../../db/enums/AnalyticsEvent")
const ArtistsRankingsFilterParams = require("../../../db/dataClasses/ArtistsRankingsFilterParams")
const { getHasherAsync, viewTypesDisplayData, caches, artistTypesWhitelists } = require(modulePath + "/shared")
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
                        artistData.songs = topTen
                        artistData.moreSongs = totalCount >= 6
                        artistData.songCount = totalCount
                    }
                    // get top co artists
                    {
                        const params = new ArtistsRankingsFilterParams()
                        params.artists = [artistId]
                        params.artistCategory = artistData.category == ArtistCategory.Producer ? ArtistCategory.Vocalist : ArtistCategory.Producer
                        params.artistTypes = artistTypesWhitelists[params.artistCategory.id]
                        //params.combineSimilarArtists = true
                        params.maxEntries = 9

                        const dbResponse = await songsDataDb.filterArtistsRankings(params)
                        const topTen = dbResponse?.results || []

                        topTen.forEach(resultItem => {
                            resultItem.preferredName = getPreferredName(resultItem.artist.names)
                        })
                        artistData.topCoArtists = topTen
                        artistData.moreCoArtists = dbResponse.totalCount >= 6
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

            // set analytics page name
            const config = request.routeConfig
            const analyticsParams = config.analyticsParams
            if (analyticsParams) {
                analyticsParams['page_name'] = artistData.preferredName
            }

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
                const localization = request.localization || {}
                // all time
                {
                    const allTimePlacement = artistData.placement.allTime
                    const toFormat = localization['artist_placement_all_time'] || ''
                    displayPlacements.push({
                        type: "views",
                        url: `/rankings/filter/set?artistCategory=${artistData.category.id}&startAt=${allTimePlacement - 1}&referer=/rankings/${isVocalist ? 'singers' : 'producers'}`,
                        text: toFormat.replace(':placement', allTimePlacement).replace(':category', isVocalist ? localization['song_singers_singular'] : localization['song_producers_singular'])
                    })
                }
                request.addHbParam('displayPlacements', displayPlacements)
            }

            // handle access level stuff
            {
                const accessLevel = request.accessLevel

                const canSeeControls = accessLevel > AccessLevel.Editor.id
                const canRefresh = canSeeControls
                const canDelete = accessLevel > AccessLevel.Admin.id

                request.addHbParam('accessStates',{
                    canSeeControls: canSeeControls,
                    canRefresh: canRefresh,
                    canDelete: canDelete
                })
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

const getRefresh = async (request, reply) => {
    const reject = (code, message) => {
        reply.send({
            code: code,
            message: message,
        });
        return;
    }

    const artistId = request.params.artistId
    if (!artistId) {
        return reject(400, "Invalid parameters provided.");
    }

    // check if the artist exists
    const exists = await database.songsDataProxy.artistExists(artistId)
        .catch(error => {
            console.log(error)
            return reject(400, error.message)
        })
    if (!exists) {
        return reject(400, `Artist with id "${artistId}" does not exist.`)
    }

    const artist = await scraper.scrapeVocaDBArtistAsync(Number(artistId) || 0)
        .catch(msg => {
            console.log(msg)
            return reply.send({ code: 400, message: msg.message })
        })

    // add the song
    await database.songsDataProxy.updateArtist(artist)
        .catch(msg => {
            console.log(msg)
            return reply.send({ code: 400, message: msg.message })
        })
    artistsDataCache.purge()

    return reply.redirect("/artist/" + artistId)
}


const getDelete = async (request, reply) => {
    const reject = (code, message) => {
        reply.send({
            code: code,
            message: message,
        });
        return;
    }

    const artistId = request.params.artistId
    if (!artistId) {
        return reject(400, 'Invalid parameters provided.')
    }

    // check if the artist exists
    const exists = await database.songsDataProxy.artistExists(artistId)
        .catch(error => {
            console.log(error)
            return reject(400, error.message)
        })
    if (!exists) {
        return reject(400, `Artist with id "${artistId}" does not exist.`)
    }

    await database.songsDataProxy.deleteArtist(artistId)
        .catch(error => {
            console.log(error)
            return reject(400, error.message)
        })
    artistsDataCache.purge()

    return reply.redirect('/')
}

// exports
exports.prefix = "/artist"

exports.register = (fastify, options, done) => {
    fastify.get("/:artistId", {
        config: {
            analyticsEvent: AnalyticsEvent.PageVisit,
            analyticsParams: { 'page_name': "" }
        },
    }, getArtist)
    fastify.get("/:artistId/refresh", {
        config: {
            accessLevel: AccessLevel.Editor.id,
            loginRedirect: true
        }
    }, getRefresh)
    fastify.get('/:artistId/delete', {
        config: {
            accessLevel: AccessLevel.Admin.id,
            loginRedirect: true
        }
    }, getDelete)

    done();
}