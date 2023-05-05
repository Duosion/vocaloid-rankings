const workingDirectory = process.cwd()
const modulePath = workingDirectory + "/server_scripts"
// imports
const scraper = require(modulePath + "/scraper")
const database = require(workingDirectory + "/db")

const { argbFromHex, themeFromSourceColor, hexFromArgb, redFromArgb, greenFromArgb, blueFromArgb } = require("@importantimport/material-color-utilities");
const EntityViews = require("../../../db/dataClasses/EntityViews")
const ViewType = require("../../../db/enums/ViewType")
const NameType = require("../../../db/enums/NameType")
const CachedThumbnail = require("../../../db/dataClasses/CachedThumbnail")
const AccessLevel = require("../../../db/enums/AccessLevel")
const { getHasherAsync, viewTypesDisplayData, caches } = require(modulePath + "/shared")
const { getPreferredLanguageName } = require(modulePath + "/locale")

// initialize caches
const songsDataCache = caches.songsDataCache
const thumbnailCache = caches.thumbnailCache

// data

/**
 * Formats a SongViews object
 * 
 * @param {EntityViews} songViews 
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
      const videoId = videoViews.id
      breakdown.push({
        number: n,
        videoId: videoId,
        views: views,
        share: views / total,
        color: colors[n % colorCount],
        displayData: displayData,
        href: displayData.videoURL.replace('{VideoID}', videoId)
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

    database.songsDataProxy.getSong(songId)
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
          const historicalViews = await database.songsDataProxy.getSongHistoricalViews(songId)

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

const toBuffer = (arrayBuffer) => {
  const buffer = Buffer.alloc(arrayBuffer.byteLength);
  const view = new Uint8Array(arrayBuffer);
  for (let i = 0; i < buffer.length; ++i) {
    buffer[i] = view[i];
  }
  return buffer;
}

// route functions
const addSongRoute = async (request, reply) => {
  const query = request.query
  request.addHbParam('pageTitle', (request.localization || {}).add_song)

  // get the url to add
  const url = query["url"]

  if (url) {
    // attempt to add the provided url

    const song = await scraper.scrapeVocaDBSongAsync(url)
      .catch(msg => {
        console.log(msg)
        return reply.send({ code: 400, message: msg.message })
      })

    if (song == undefined) {
      params.errorMessage = 'Invalid URL provided.'
      return reply.view("pages/addSong.hbs", params)
    }

    // add the song
    await database.songsDataProxy.insertSong(song)
      .catch(msg => {
        return reply.send({ code: 400, message: msg.message })
      })

    // if it succeeded, redirect to the new page
    reply.statusCode = 302
    reply.redirect(`/song/${encodeURIComponent(song.id)}`)

  } else {

    return reply.view("pages/addSong.hbs", request.hbParams)

  }
}

const refreshSongRoute = async (request, reply) => {
  const reject = (code, message) => {
    reply.send({
      code: code,
      message: message,
    });
    return;
  }

  const songId = request.params.songId
  if (!songId) {
    return reject(400, "Invalid parameters provided.");
  }

  // check if the song exists
  const exists = await database.songsDataProxy.songExists(songId)
    .catch(error => {
      console.log(error)
      return reject(400, error.message)
    })
  if (!exists) {
    return reject(400, `Song with id "${songId}" does not exist.`)
  }

  const song = await scraper.scrapeVocaDBSongAsync(Number(songId) || 0)
    .catch(msg => {
      console.log(msg)
      return reply.send({ code: 400, message: msg.message })
    })

  // add the song
  await database.songsDataProxy.updateSong(song)
    .catch(msg => {
      console.log(msg)
      return reply.send({ code: 400, message: msg.message })
    })
  songsDataCache.purge()

  return reply.redirect("/song/" + songId)
}

const deleteSongRoute = async (request, reply) => {
  const reject = (code, message) => {
    reply.send({
      code: code,
      message: message,
    });
    return;
  }

  const songId = request.params.songId
  if (!songId) {
    return reject(400, 'Invalid parameters provided.')
  }

  // check if the song exists
  const exists = await database.songsDataProxy.songExists(songId)
    .catch(error => {
      console.log(error)
      return reject(400, error.message)
    })
  if (!exists) {
    return reject(400, `Song with id "${songId}" does not exist.`)
  }

  await database.songsDataProxy.deleteSong(songId)
    .catch(error => {
      console.log(error)
      return reject(400, error.message)
    })
  
  songsDataCache.purge()
  
  return reply.redirect('/rankings')
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
      console.log(msg)
      reply.send({ code: 400, message: msg.message })
      return;
    })
  hbParams['songData'] = songData

  // set page title
  request.addHbParam('pageTitle', songData.preferredName)

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
          const hrefs = []
          videoIds.forEach(id => {
            hrefs.push(displayData.videoURL.replace('{VideoID}', id))
          })
          displayVideoIds[videoType] = {
            displayData: displayData,
            hrefs: hrefs
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

  // get placement display data
  {
    const displayPlacements = []

    // all time
    {
      const allTimePlacement = songData.placement.allTime
      const toFormat = hbParams.localization.song_placement_all_time
      displayPlacements.push({
        type: "views",
        url: "/rankings/filter/set?startAt=" + (allTimePlacement - 1),
        text: toFormat.replace(':placement', allTimePlacement)
      })
    }

    //release year
    {
      const releaseYear = new Date(songData.publishDate).getFullYear()
      const toFormat = hbParams.localization.song_placement_release_year
      displayPlacements.push({
        type: "views",
        url: `/rankings/filter/set?publishDate=${releaseYear}`,
        text: toFormat.replace(':placement', songData.placement.releaseYear).replace(':releaseYear', releaseYear)
      })
    }
    hbParams.displayPlacements = displayPlacements
  }

  // handle access level stuff
  {
    const accessLevel = request.accessLevel

    const canSeeControls = accessLevel > AccessLevel.Editor.id
    const canRefresh = canSeeControls
    const canDelete = accessLevel > AccessLevel.Admin.id

    hbParams.accessStates = {
      canSeeControls: canSeeControls,
      canRefresh: canRefresh,
      canDelete: canDelete
    }
  }

  return reply.view("pages/song.hbs", hbParams)
}

/**
 * Proxy for getting a song's thumbnail.
 * 
 * @param {*} request 
 * @param {*} reply 
 */
const getThumbnail = (request, reply) => {
  const songId = Number.parseInt(request.params.songId)
  if (!songId) {
    reply.send({
      code: 400,
      message: "Invalid parameters provided",
    })
  }
  const useMaxresThumbnail = request.query.maxRes ? true : false

  const cacheKey = `${songId}_${useMaxresThumbnail ? "1" : "0"}`
  const cached = thumbnailCache.get(cacheKey)

  const sendThumbnail = (data) => {
    try {
      if (data.type == ViewType.bilibili) {
        reply.type('image/jpg').send(data.data)
      } else {
        reply.redirect(data.data)
      }
    } catch (error) {
      reply.redirect("/")
    }
  }

  // check if the thumbnail is cached
  if (cached) {
    sendThumbnail(cached.getData())
  } else {
    database.songsDataProxy.getSong(songId)
      .then(song => {
        if (!song) { throw 'No song data found.'}
        const thumbnail = useMaxresThumbnail ? song.maxresThumbnail : song.thumbnail
        const thumbnailType = song.thumbnailType
        const cachedThumbnail = new CachedThumbnail(null, thumbnailType)

        if (thumbnailType == ViewType.bilibili) {
          fetch(useMaxresThumbnail ? song.maxresThumbnail : song.thumbnail)
            .then(response => response.arrayBuffer())
            .then(imageBuffer => toBuffer(imageBuffer))
            .then(buffer => {
              cachedThumbnail.data = buffer
              thumbnailCache.set(cacheKey, cachedThumbnail)
              sendThumbnail(cachedThumbnail)
            })
        } else {
          cachedThumbnail.data = thumbnail
          thumbnailCache.set(cacheKey, cachedThumbnail)
          sendThumbnail(cachedThumbnail)
        }
      })
      .catch(msg => {
        console.log(msg)
        reply.send({ code: 400, message: "Invalid song id provided." })
        return;
      })
  }
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
  fastify.get("/:songId/refresh", {
    config: {
      accessLevel: AccessLevel.Editor.id,
      loginRedirect: true
    }
  }, refreshSongRoute)
  fastify.get('/:songId/delete', {
    config: {
      accessLevel: AccessLevel.Admin.id,
      loginRedirect: true
    }
  }, deleteSongRoute)
  fastify.get('/thumbnail/:songId', getThumbnail)

  done();
}