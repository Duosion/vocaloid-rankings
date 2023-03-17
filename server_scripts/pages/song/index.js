const workingDirectory = process.cwd()
const modulePath = workingDirectory + "/server_scripts"
// imports
const scraper = require(modulePath + "/scraper")
const database = require(workingDirectory + "/db")
const databaseProxy = require(modulePath + "/database")

const { getAverageColor } = require("fast-average-color-node")
const { argbFromHex, themeFromSourceColor, applyTheme, hexFromArgb, redFromArgb, greenFromArgb, blueFromArgb } = require("@importantimport/material-color-utilities");
const SongViews = require("../../../db/dataClasses/SongViews")
const ViewType = require("../../../db/enums/ViewType")
const NameType = require("../../../db/enums/NameType")
const { generateTimestamp, getHasherAsync, viewTypesDisplayData, caches } = require(modulePath + "/shared")
const { getPreferredLanguageName } = require(modulePath + "/locale")

// initialize caches
const songsDataCache = caches.songsDataCache
const historicalCache = caches.historicalCache

// data


// functions
const addSong = (vocaDBURL) => {
  return new Promise(async (resolve, reject) => {

    const timestamp = generateTimestamp()

    // get vocaDB data
    const songData = await scraper.scrapeVocaDB(vocaDBURL).catch(err => { reject(err) })
    if (!songData || songData == undefined) { reject("Provided song doesn't exist."); return; }

    const viewsMetadata = await database.views.getMetadata()

    // get the most recent views data
    const mostRecentViewsMetadata = viewsMetadata[viewsMetadata.length - 1]

    // get the song's ID
    const songID = songData.songId

    // check if the song already exists
    if (await database.songs.songExists(songID)) { reject("The provided song is already in the database."); return; }

    // compute total views
    const viewsBreakdown = {}
    let viewData = {
      songId: songID,
      total: 0,
      breakdown: viewsBreakdown
    }

    {

      for (let [viewType, views] of Object.entries(songData.views)) {
        viewsBreakdown[viewType] = views
        viewData.total += views
      }

      delete songData.views // delete object
    }

    // add required values
    songData.additionDate = new Date().toISOString()

    // write to files
    await databaseProxy.addSongFromScraperData(mostRecentViewsMetadata.timestamp, songData, viewData)

    resolve(songData)

  })
}

/**
 * Formats a SongViews object
 * 
 * @param {SongViews} songViews 
 * @returns {Object}
 */
const getViewsBreakdownDisplayData = (songViews) => {

  const total = songViews.total

  // format the breakdown
  const breakdown = []

  for (const [typeId, breakdowns] of Object.entries(songViews.breakdown)) {
    const displayData = viewTypesDisplayData[typeId]
    const colors = displayData.colors
    const colorCount = colors.length

    for (const [n, videoViews] of breakdowns.entries()) {
      const views = videoViews.views
      breakdown.push({
        number: n,
        videoId: videoViews.id,
        views: views,
        share: views / total,
        color: colors[n % colorCount],
        displayData: displayData
      })
    }
  }

  breakdown.sort((a, b) => {
    return b.views - a.views
  })

  return breakdown

}

const querySongsDatabaseAsync = (queryData) => {
  return new Promise(async (resolve, reject) => {

    const queryHash = (await getHasherAsync())(JSON.stringify(queryData))
    {
      // check for cache
      const cachedData = songsDataCache.get(queryHash)
      if (cachedData) {
        resolve(cachedData.getData())
        return;
      }
    }

    // parse queryData
    const songId = Number.parseInt(queryData.songId)

    database.songsData.getSong(songId)
      .then(async songData => {
        if (!songData) {
          reject("No data found for song '" + songId + "'.");
          return;
        }

        songData.displayBreakdown = getViewsBreakdownDisplayData(songData.views)

        const preferredLanguage = queryData.preferredLanguage || NameType.Original

        const getPreferredName = (names) => {
          return getPreferredLanguageName(names, preferredLanguage)
        }

        // set preferred name
        songData.preferredName = getPreferredName(songData.names)

        // get artists names
        {
          songData.artists.forEach(artist => {
            artist.preferredName = getPreferredName(artist.names)
          })
        }

        // get historical views
        {
          const historicalViews = await database.songsData.getSongHistoricalViews(songId)

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

          songData.historicalViews = historicalViews
        }

        // cache return data
        songsDataCache.set(queryHash, songData)

        resolve(songData)

      }).catch(error => { reject(error) })

  })
}

const getHistoricalDataAsync = (queryData) => {
  return new Promise(async (resolve, reject) => {
    // hash query data & check for cache
    const queryHash = (await getHasherAsync())(JSON.stringify(queryData))
    {
      // check for cache
      const cachedData = historicalCache.get(queryHash)
      if (cachedData) {
        resolve(cachedData.getData())
        return;
      }
    }

    // get data
    const data = await databaseProxy.getHistoricalData(queryData)

    var highestViews = 1

    data.forEach(entry => {
      const date = new Date(entry.timestamp)

      const dateString = `${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getDate().toString().padStart(2, "0")}`

      highestViews = Math.max(highestViews, entry.total)

      entry.dateString = dateString
    })

    //calculate share
    data.forEach(entry => {
      entry.share = entry.total / highestViews
    })

    resolve(data)

  })
}

const getRgbMdTokenFromArgb = (argb, suffix = '') => {
  return `--md-sys-color-${suffix}-rgb: ${redFromArgb(argb)} ${greenFromArgb(argb)} ${blueFromArgb(argb)};`
}

const getCustomThemeStylesheet = (theme, suffix = "", key = "") => {

  const cacheKey = `${key}${suffix}`
  {
    const cached = songsDataCache.get(cacheKey)
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

  songsDataCache.set(cacheKey, lines)

  return lines

}

// route functions
const addSongRoute = async (request, reply) => {
  const parsedCookies = request.parsedCookies

  const query = request.query
  const params = {
    seo: request.seo,
    cookies: parsedCookies,
    pageTitle: "Filter Rankings",
  }

  // get the url to add
  const url = query["url"]

  if (url) {
    // attempt to add the provided url

    const added = await addSong(url).catch(err => {

      params.errorMessage = err

      return reply.view("pages/addSong.hbs", params);

    })

    // if it succeeded, redirect to the new page
    reply.statusCode = 302
    reply.redirect(`/song/${encodeURIComponent(added.songId)}`)

  } else {

    // view the add song page

    params.pageTitle = "Add Song"

    return reply.view("pages/addSong.hbs", params)

  }
}

// song page
const getSong = async (request, reply) => {
  const parsedCookies = request.parsedCookies || {}
  const hbParams = request.hbParams

  // add referer
  hbParams.referer = request.query["referer"] || "/"

  // get song id
  const songId = request.params.songId
  if (!songId) {
    reply.send({
      code: 400,
      message: "Invalid parameters provided",
    });
    return;
  }

  // query database
  const songData = await querySongsDatabaseAsync({
    songId: songId,
    preferredLanguage: NameType.fromId(parsedCookies.titleLanguage),
  })
    .catch(msg => {
      reply.send({ code: 404, message: msg })
      return;
    })
  hbParams['songData'] = songData

  // load custom theme 
  {
    const theme = themeFromSourceColor(argbFromHex(songData.averageColor), [
      {
        name: "songs-color",
        value: argbFromHex("#ff0000"),
        blend: true,
      },
    ]);

    // Print out the theme as JSON
    const schemes = theme.schemes
    hbParams.customTheme = getCustomThemeStylesheet(schemes.light.props, "light", songId).join('') + getCustomThemeStylesheet(schemes.dark.props, "dark", songId).join('')
  }

  // load song names
  {
    const songNames = []
    for (const [id, name] of songData.names.entries()) {
      if (name) {
        songNames.push({
          name: NameType.fromId(id).name,
          value: name
        })
      }
    }
    hbParams.displayNames = songNames
  }

  // get video id display data
  {
    const displayVideoIds = []
    for (const [videoType, videoIds] of songData.videoIds.entries()) {
      if (videoIds) {
        const displayData = viewTypesDisplayData[videoType]
        if (displayData) {
          displayVideoIds[videoType] = {
            displayData: displayData,
            ids: videoIds
          }
        }
        // add youtube player
        if (videoType == ViewType.YouTube.id) {
          hbParams.youtubePlayerId = videoIds[0]
        }
      }
    }
    hbParams.displayVideoIds = displayVideoIds
  }

  return reply.view("pages/songv2.hbs", hbParams)
}

exports.prefix = "/song"

exports.register = (fastify, options, done) => {
  fastify.get("/:songId", {
    config: {
      analyticsEvent: "page_visit",
      analyticsParams: { 'page_name': "" }
    },
  }, getSong)
  fastify.get("/add", addSongRoute)

  done();
}