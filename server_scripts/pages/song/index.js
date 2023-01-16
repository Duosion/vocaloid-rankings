const workingDirectory = process.cwd()
const modulePath = workingDirectory + "/server_scripts"
// imports
const scraper = require(modulePath + "/scraper")
const database = require(workingDirectory + "/db")
const databaseProxy = require(modulePath + "/database")

const { getAverageColor } = require("fast-average-color-node")
const { argbFromHex, themeFromSourceColor, applyTheme, hexFromArgb, redFromArgb, greenFromArgb, blueFromArgb } = require("@importantimport/material-color-utilities");
const { generateTimestamp, getHasherAsync, viewTypes, caches } = require(modulePath + "/shared")
const { getPreferredLanguageName } = require(modulePath + "/locale")

// initialize caches
const songsDataCache = caches.songsDataCache
const historicalCache = caches.historicalCache

// functions
const addSong = (vocaDBURL) => {
    return new Promise( async (resolve, reject) => {
      
      const timestamp = generateTimestamp()
      
      // get vocaDB data
      const songData = await scraper.scrapeVocaDB(vocaDBURL).catch( err => { reject(err) } )
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

const formatViewData = (viewDataRaw) => {
  
    const total = viewDataRaw.total
    
    // format the breakdown
    const breakdown = []
    
    for (let [viewType, viewAmount] of Object.entries(viewDataRaw.breakdown)) {
      const typeData = viewTypes[viewType]
      
      const formatted = { value: viewAmount }
      
      formatted.share = viewAmount / total
      
      formatted.color = typeData.BarColor
      formatted.textColor = typeData.TextColor
      
      formatted.viewType = viewType
      
      breakdown.push(formatted)
      
    }
  
    breakdown.sort( (a, b) => {
      return b.value - a.value
    })
    
    return {
      
      total: { value: total },
      breakdown: breakdown
      
    }
    
}

const querySongsDatabaseAsync = (queryData) => {
    return new Promise( async (resolve, reject) => {
      
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
      const songID = queryData.SongID
      
      databaseProxy.getSongData(songID)
        .then(songData => {
        
        if (!songData) { 
            reject("No view data found for song '" + songID + "'."); 
            return; 
        }
      
        songData.views = formatViewData(songData.views)
        
        const setPreferredName = (names) => {
          names.preferred = getPreferredLanguageName(names, queryData.Language || rankingsFilterQueryTemplate.Language.default)
        } 

        // set preferred name
          setPreferredName(songData.names)
        
        // get artists names
        {
          const artists = [...songData.singers, ...songData.producers]
          artists.forEach(artist => {
            setPreferredName(artist.names)
          })
        }

        // cache return data
          songsDataCache.set(queryHash, songData)

        resolve(songData)
        
      }).catch(error => {reject(error)})
  
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
        
        const dateString = `${(date.getMonth() + 1).toString().padStart(2,"0")}/${date.getDate().toString().padStart(2,"0")}`
        
        highestViews = Math.max(highestViews, entry.total)
  
        entry.dateString = dateString
      })
      
      //calculate share
      data.forEach(entry => {
        entry.share = entry.total/highestViews
      })
  
      resolve(data)
      
    })
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
    const red = redFromArgb(primary)
    const green = greenFromArgb(primary)
    const blue = blueFromArgb(primary)
    lines.push(`--md-sys-color-primary-${suffix}-rgb: ${red} ${green} ${blue};`)
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
        
        const added = await addSong(url).catch( err => {

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
  
  const params = { 
    seo: request.seo,
    cookies: parsedCookies,
    referer: request.query["referer"] || "/"
  }
  
  // get song name
  const songID = request.params.songID
  if (!songID) { 
    reply.send({
      code: 400 ,
      message: "Invalid parameters provided",
    });
    return;
  }
  
  // parse locale
  const locale = (request.headers["accept-language"] || "").split(",")[0]
  
  // construct queryData
  const queryData = {
    Locale: locale,
    SongID: songID,
    Language: parsedCookies.displayLanguage,
  }
  
  // query database
  const songData = await querySongsDatabaseAsync(queryData)
  .catch(msg => {
    reply.send({code: 404, message: msg})
    return;                   
  })
  params.songData = songData

  //construct viewdata table
  const newVideoIDs = {}
  for (let [viewType, videoIDs] of Object.entries(songData.videoIds) ) {
    
    const viewData = viewTypes[viewType]
    if (!viewData || viewData == undefined) { continue; }

    const videoID = videoIDs[0]

    const hrefs = []
    const videoURL = viewData.VideoURL

    videoIDs.forEach( id => {
      hrefs.push(videoURL.replace("{VideoID}", id))
    })
    
    newVideoIDs[viewType] = {
      
      ids: videoIDs,
      hrefs: hrefs,
      
      ...viewData
      
    }
    
  }
  params.videoIDs = newVideoIDs

  //add youtube player
  {
    const youtubeId = newVideoIDs["YouTube"]
    if (youtubeId) {
      params.youtubePlayerId = youtubeId.ids[0]
    }
  }
  
  
  //get historical data
  {
    const historicalData = await getHistoricalDataAsync({SongId: songID})
    
    params.historicalData = historicalData
  }
  
  // set page title
  params.pageTitle = songData.names.preferred

  // load page theme
  {
    const averageColor = await getAverageColor(songData.thumbnail)
    // Get the theme from a hex color
    const theme = themeFromSourceColor(argbFromHex(averageColor.hex), [
      {
        name: "custom-1",
        value: argbFromHex("#ff0000"),
        blend: true,
      },
    ]);

    // Print out the theme as JSON
    const schemes = theme.schemes
    params.customTheme = getCustomThemeStylesheet(schemes.light.props, "light", songID).join('') + getCustomThemeStylesheet(schemes.dark.props, "dark", songID).join('')
  }

  // update analytics
  request.routeConfig.analyticsParams['page_name'] = songID
  return reply.view("pages/song.hbs", params)
}

exports.prefix = "/song"

exports.register = (fastify, options, done) => {
  fastify.get("/:songID", {
    config: {
      analyticsEvent: "page_visit",
      analyticsParams: {'page_name': ""}
    },
  },getSong)
  fastify.get("/add", addSongRoute)

  done();
}