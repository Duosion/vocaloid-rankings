const workingDirectory = process.cwd()
const modulePath = workingDirectory + "/server_scripts"

// import
const NameType = require(workingDirectory + "/db/enums/NameType")
const database = require(workingDirectory + "/db")
const songsDataDb = database.songsData

// import modules
const { argbFromHex, themeFromSourceColor, hexFromArgb, redFromArgb, greenFromArgb, blueFromArgb } = require("@importantimport/material-color-utilities");
const { getHasherAsync, caches } = require(modulePath + "/shared")
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
                    const baseArtistId = artistData.baseArtistId
                    if (baseArtistId) {
                        artistData.baseArtist = await songsDataDb.getArtist(baseArtistId)
                            .then(artistData => {
                                if (artistData) {
                                    artistData.preferredName = getPreferredName(artistData.names)
                                }
                                return artistData
                            })
                            .catch(error => reject(error))
                    }

                    // get similar voicebanks
                    const children = (await songsDataDb.getArtistChildren(baseArtistId || artistId)
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