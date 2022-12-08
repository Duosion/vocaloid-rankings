// scrapes the vocaloid wiki
const fetch = require("node-fetch")
const database = require("../db")
const { viewRegExps } = require("./shared")
//const jsdom = require("jsdom")
  //const { JSDOM } = jsdom;// jsdom constructor

const { parseHTML } = require("linkedom")

// strings
const scrapeDomains = {
  Vocaloid: {
    Domain: "https://vocaloid.fandom.com",
    ListURLs: [
      // youtube
      "/wiki/Category:Songs_with_10M_YouTube_views",
      "/wiki/Category:Songs_approaching_10M_YouTube_views",
      "/wiki/Category:Songs_with_100M_YouTube_views",
      
      // niconico
      "/wiki/Category:Hall_of_Myths",
      "/wiki/Category:Songs_approaching_10M_Niconico_views",
      
      // bilibili
      "/wiki/Category:Songs_with_1M_bilibili_views",
      "/wiki/Category:Songs_with_10M_bilibili_views"
    ]
  },
  CeVIO: {
    Domain: "https://cevio-lyrics.fandom.com",
    ListURLs: [
      // youtube
      "/wiki/Category:Songs_with_1M_YouTube_views",
      "/wiki/Category:Songs_with_10M_YouTube_views"
    ]
  }
}

const nicoNicoVideoDomain = "https://www.nicovideo.jp/watch/"
const bilibiliVideoDomain = "https://www.bilibili.com/video/"

const vocaDBApiUrl = "https://vocadb.net/api/";
// entries api
const vocaDBRecentSongsApiUrl = "https://vocadb.net/api/songs?sort=AdditionDate&onlyWithPVs=true&status=Finished&fields=Names,PVs,Artists"
const vocaDBRecentSongsViewsThreshold = 10000 // how many views a recent song must have to be entered into this database
const vocaDBRecentSongsUploadDateThreshold = 24 * 60 * 60 * 1000 * 3 // (in ms) the minimum age in days of a song to be entered into this database
const vocaDBDefaultMaxResults = 10
// song api
const vocaDBSongApiUrl = vocaDBApiUrl + "songs/"
const vocaDBSongApiParams = "?fields=Artists,Names,PVs&lang=Default"


// reg expressions
const vocaDbIDMatches = [
  /https:\/\/vocadb\.net\/S\/(\d+)/,
]

const listEntryRegExp = /<a href="(.+)" class="category-page__member-link"/g

const niconicoViewsRegExp = /&quot;view&quot;:(\d+),/i
const niconicoThumbnailRegExp = /&quot;thumbnail&quot;:{&quot;url&quot;:&quot;([^,]+)&quot;/i ///&quot;middleUrl&quot;:([^,]+),/i

// functions

// exported function
  const getBilibiliData = async (videoID) => {
    
    const serverResponse = await fetch(bilibiliVideoDomain + videoID).catch(error => {return null})
    if (!serverResponse) { return {Views: 0, Thumbnail: null}; }
    const responseText = await serverResponse.text()
    
    const { document } = await parseHTML(responseText)
    
    // get thumbnail element
    const thumbnailElement = document.querySelector("meta[itemprop='thumbnailUrl']")
    if (!thumbnailElement) { return {Views: 0, Thumbnail: null}; }
      
    // get the view element
    const viewsElement = document.querySelector(".view.item")
    if (!viewsElement) { return {Views: 0, Thumbnail: null}; }
    
    const viewsMatch = viewsElement.title.match(/(\d+)/)
    const views = viewsMatch ? viewsMatch[1] : 0
    
    return {
      
      Views: Number(views),
      
      Thumbnail: thumbnailElement.getAttribute("content"),
      
    }
    
  }

  const getYouTubeData = async (videoID) => {
  
    const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoID}&key=${process.env.YoutubeAPIKey}`)

    const responseBody = await response.json()

    const items = responseBody["items"]

    const firstItem = items != undefined ? responseBody["items"][0] : null
    
    return {
      
      Views: firstItem ? Number(firstItem["statistics"]["viewCount"]) : 0,
      
      Thumbnail: `https://img.youtube.com/vi/${videoID}/hqdefault.jpg`
      
    }
    
  }

  const getNiconicoData = async (videoID) => {
    
    const serverResponse = await fetch(nicoNicoVideoDomain + videoID).catch(error => {return null})
    if (!serverResponse) { return {Views: 0, Thumbnail: null}; }
    const responseText = await serverResponse.text()
    
    const parsedHTML = await parseHTML(responseText)
    // parse data-api-data
      const dataElement = parsedHTML.document.getElementById("js-initial-watch-data")
      if (!dataElement) { return {Views: 0, Thumbnail: null}; }
      
      const videoData = JSON.parse(dataElement.getAttribute("data-api-data")).video
      
    return {
      
      Views: Number(videoData.count.view),
      
      Thumbnail: videoData.thumbnail.url,
      
    }
    
    /*const DOM = await JSDOM.fromURL(nicoNicoVideoDomain + videoID).catch(error => { return error;})
    if (!DOM) { return 0;}
    
    const { document } = DOM.window; // get the document
    
    // get the video api data
    let dataElement = document.querySelector("#js-initial-watch-data")
    
    let data = dataElement ? dataElement.getAttribute("data-api-data") : null
    
    if (!data) { return 0; }
    
    try {
      
      return JSON.parse(data).video.count.view; // return views
      
    } catch (error) {
      
      return 0; // return 0 views if parse failed
      
    }*/
    
  }
  
  
  
  const vocaDBPVPolls = {
    ["Youtube"]: {
      DataName: "YouTube",
      Poller: getYouTubeData
    },
    ["NicoNicoDouga"]: {
      DataName: "Niconico",
      Poller: getNiconicoData
    },
    ["Bilibili"]: {
      DataName: "bilibili",
      IDPrefix: "av",
      Poller: getBilibiliData
    }
  }
  
  const viewTypePollers = {
    ["YouTube"]: getYouTubeData,
    ["Niconico"]: getNiconicoData,
    ["bilibili"]: getBilibiliData
  }

  const allowedArtistTypes = {
    ["CeVIO"]: true,
    ["Vocaloid"]: true,
    ["OtherVoiceSynthesizer"]: true,
    ["SynthesizerV"]: true,
  }
  
  const vocaDBLanguageMap = {
    ["Japanese"]: "Japanese",
    ["Romaji"]: "Romaji",
    ["English"]: "English"
  }
  
  const getVideoViewsAsync = (videoIDs) => {
    
    return new Promise( async (resolve, reject) => {
      
      const breakdown = {}
      
      const returnData = {
        
        total: 0,
        breakdown: breakdown
        
      }
      
      for (let [viewType, IDs] of Object.entries(videoIDs)) {
        
        const viewData = viewRegExps[viewType]
        const poller = viewTypePollers[viewType]

        if (viewData && poller) {
          
          var totalViews = 0;
          
          for (let [_, videoID] of IDs.entries()) {
            const views = (await poller(videoID)).Views
          
            totalViews += views
            
          }
          
          returnData.total += totalViews

          breakdown[viewType] = totalViews
          
        }
        
      }
      
      // resolve with the view count
      resolve(returnData)
    })
    
  }

  const getSongURLs = async () => {
    
    const urlMatches = {}
    
    for (let [songType, domainData] of Object.entries(scrapeDomains)) {
      
      const matches = []
      
      for (let [_, ListURL] of domainData.ListURLs.entries()) {
      
        const response = await fetch(domainData.Domain + ListURL)

        const responseText = await response.text()
        
        const parsedHTML = await parseHTML(responseText)

        const document = parsedHTML.document;

        const externalURLs = document.querySelectorAll(".category-page__member-link")
        
        for (let [_, element] of externalURLs.entries()) {
          matches.push(decodeURIComponent(element.href))
        }
      
      }
      
      urlMatches[songType] = matches
        
    }
    
    return urlMatches

  }

  const getVocaDBRecentSongs = (maxResults = vocaDBDefaultMaxResults, offset = 0) => {
    // gets the most recent song entries from vocaDB
    return new Promise(async (resolve, reject) => {
      try {
        resolve(
          fetch(`${vocaDBRecentSongsApiUrl}&start=${offset}&maxResults=${maxResults}`)
            .then(response => response.json())
            .then(json => { return json['items'] })
            .catch(error => { reject(error) }))
      } catch (error) {
        reject(error)
      }
    })
  }
  
  const getVocaDbID = (input) => {
    // attempts to get an ID from the provided input
    for (let [_, regExp] of vocaDbIDMatches.entries()) {
      const match = input.match(regExp)
      if (match) { return match[1] }
    }
    
    return null;
  }
  
  const processVocaDBSongData = (songData) => {
    return new Promise(async (resolve, reject) => {

      switch(songData.songType) {
        case "Instrumental":
        case "MusicPV":
          reject("Blacklisted song type.");
          return;
      }
      
      const id = songData.id.toString()

      // get singers & producers
        var songType = null
        const singers = []
        const producers = []
        
        for (let [_, artist] of songData.artists.entries()) {
          
          const artistCategories = artist.categories.split(",")
          
          for (let [_, category] of artistCategories.entries()) {
            category = category.trim(); // trim whitespace
            
            switch (category) {
              case "Producer": {
                producers.push(artist.name.trim())
                break;
              }
              case "Vocalist": {
                singers.push(artist.name.trim())
                
                // update the songType
                const singerData = artist.artist
                const artistType = singerData ? singerData.artistType : null
                if (artistType && allowedArtistTypes[artistType]) {
                  songType = artistType
                }
                
                break; 
              }
            }
          }
        }
        
        if (!songType) { 
          
          {
            // attempt to get the original version

            const originalVersionID = songData.originalVersionId
            if (originalVersionID && songData.songType == "Cover") {
              resolve(scrapeVocaDB(`https://vocadb.net/S/${originalVersionID}`))
              return
            }

          }
          
          reject("Song has invalid song type."); 
          return
        }
      
      // get names
        const names = {};
        for (let [_, name] of songData.names.entries()) {
          const language = vocaDBLanguageMap[name.language]
          if (language) {
            names[language] = name.value
          }
        }
      
      names["Original"] = songData.name
      
      // get video ID & thumbnail data
        
        var thumbnail = null;
        const videoIDs = {};
        const views = {}
        
        {
          const thumbnails = {};
          
          for (let [_, pv] of songData.pvs.entries()) {
            const poller = vocaDBPVPolls[pv.service]
            if (pv.pvType == "Original" && !pv.disabled && poller) { // make sure that the song isn't a cover
              const dataName = poller.DataName
              const prefix = poller.IDPrefix
              const pvID = prefix ? prefix + pv.pvId : pv.pvId
              
              var serviceIDs = videoIDs[dataName] // get the service ids table
              if (!serviceIDs) {
                // if it doesn't exist, create it
                serviceIDs = []
                videoIDs[dataName] = serviceIDs // add to videoIDs table
              }
              serviceIDs.push(pvID) // add video to service IDs table
              
              const pollerData = await poller.Poller(pvID)
              
              // add views
              const currentViews = views[dataName] || 0
              views[dataName] = currentViews + pollerData.Views
              
              // add thumbnail
              if (!thumbnails[dataName]) {
                thumbnails[dataName] = pollerData.Thumbnail
              }
              
            }
          }
          
          // pick the thumbnail in the correct order
          for (let [_, poller] of Object.entries(vocaDBPVPolls)) {
            const thumb = thumbnails[poller.DataName]
            if (thumb) {
              thumbnail = thumb
              break;
            }
          }
          
        }
      
      resolve({ // return data
        
        songId: id,

        songType: songType,
        
        singers: singers,
        producers: producers,
        
        publishDate: songData.publishDate,
        additionDate: new Date().toISOString(),
        
        thumbnail: thumbnail,
        
        names: names,
        
        videoIds: videoIDs, // video ids
        
        views: views,
        
      })
    })
  }

  const scrapeVocaDB = (vocaDbURL) => {
    
    return new Promise( async (resolve, reject) => {
      // get the vocaDB ID
      const id = typeof(vocaDbURL) == "number" ? vocaDbURL : getVocaDbID(vocaDbURL)
      if (!id) { reject("Invalid URL provided.") }

      // fetch the data from the vocaDB API
      const serverResponse = await fetch(`${vocaDBSongApiUrl}${id}${vocaDBSongApiParams}`)
        .then(response => response.json())
        .catch(error => { reject(error); return })
      if (!serverResponse) { reject("No server response."); return; }

      resolve(processVocaDBSongData(serverResponse))
    })
    
  }

  const getRecentSongs = () => {
    return new Promise(async (resolve, reject) => {
      try {
        
        console.log("Getting recent songs...")

        const msInDay = 24 * 60 * 60 * 1000; // the number of milliseconds in a day

        var timeNow = null;
        var yearNow = null;
        var monthNow = null;
        var dayNow = null;

        const recentSongs = [] // songs to return

        var continueFetching = true
        var offset = 0;
        while (continueFetching) {
          continueFetching = false
          console.log("offset [" + offset + "]")

          const apiResponse = await getVocaDBRecentSongs(vocaDBDefaultMaxResults, offset)

          for (const [_, entryData] of apiResponse.entries()) {

            if (timeNow == null) {
              timeNow = new Date(entryData.createDate)
              yearNow = timeNow.getFullYear()
              monthNow = timeNow.getMonth()
              dayNow = timeNow.getDate()
            }

            if (entryData.songType != "Cover") {

              const songData = await processVocaDBSongData(entryData)
                .catch(err => { return null })

              if (songData != null) {
                var totalViews = 0
                for (const [_, views] of Object.entries(songData.views)) {
                  totalViews += views
                }

                if ((totalViews >= vocaDBRecentSongsViewsThreshold) && (vocaDBRecentSongsUploadDateThreshold > (timeNow - new Date(songData.publishDate)))) {
                  console.log(`${songData.songId} meets views threshold (${totalViews} views)`)
                  recentSongs.push(songData)
                }
              }

            }
          }

          // repeat until the entry's date is no longer today
          const createDate = new Date(apiResponse[apiResponse.length - 1]["createDate"])

          continueFetching = createDate.getFullYear() == yearNow &&
            createDate.getMonth() == monthNow &&
            createDate.getDate() == dayNow;

          offset += vocaDBDefaultMaxResults
        }

        console.log("Finished getting recent songs.")

        resolve(recentSongs)
      } catch (error) {
        reject(error)
      }
    })
  }
  
  const getSongData = (songURL, songType) => { // v3
    
    return new Promise( async (resolve, reject) => {
      
      const songsData = []
      
      if (songType) {

        const domainData = scrapeDomains[songType]

            const serverResponse = await fetch(domainData.Domain + songURL).catch(error => { reject(error); return;})
 
            const responseText = await serverResponse.text()

            const parsedHTML = await parseHTML(responseText)

            const document = parsedHTML.document;

            const externalURLs = document.querySelectorAll(".external.text")
            
            var newURL;
            
            for (let [_, element] of externalURLs.entries()) {

              const href = element.href

              if (href.match(vocaDbIDMatches[0])) {
                
                const songData = await scrapeVocaDB(href).catch(err => reject(err))

                if (songData) {
                  songsData.push(songData)
                }
              }

            }
        
      } else {
        // get song data from vocaDB
        const songData = await scrapeVocaDB(songURL).catch(err => reject(err))

        if (songData) {
          songsData.push(songData)
        }
      }
      
      resolve(songsData)

    })
    
  }
  
  const getSongsData = (timestamp, excludeURLs, excludeIDs) => {
    return new Promise( async (resolve, reject) => {
      let songURLs = await getSongURLs()

      excludeURLs = excludeURLs || {} // make sure it's not null
      excludeIDs = excludeIDs || {}

      for (let [songType, URLs] of Object.entries(songURLs)) {
        for (let [n, URL] of URLs.entries()) {
          
          if (!excludeURLs[URL]) {

            excludeURLs[URL] = true // make the URL excluded

            const songsData = await getSongData(URL, songType).catch(err => { console.log(`URL ${URL} failed to parse. Error: ${err}`) })

            if (songsData) {

              for (let [_, songData] of songsData.entries()) {
                const songID = songData.songId
                
                const songViews = songData.views
                  
                // add fandom URL
                songData.fandomURL = URL
                  
                // compute total views
                  let viewData = {
                    songId: songID,
                    total: 0,
                    breakdown: {...songViews}
                  }

                  {
                    for (let [_, views] of Object.entries(songViews)) {
                      viewData.total += views
                    }

                    delete songData.views // delete object
                  }
                console.log(`[${songType}]`, n+1, "out of", URLs.length)

                if (viewData.total > 0) {
                  database.songs.insertSong(songID, songData)
                  database.views.insertViewData(timestamp, viewData)
                }
                
                excludeIDs[songID] = true

              }

            }

          }

        }
      }

      resolve()

    })
  }
  
exports.scrapeDomains = scrapeDomains
  
exports.getVideoViewsAsync = getVideoViewsAsync
exports.getSongURLs = getSongURLs
exports.getSongData = getSongData
exports.scrapeVocaDB = scrapeVocaDB
exports.getSongsData = getSongsData
exports.getRecentSongs = getRecentSongs