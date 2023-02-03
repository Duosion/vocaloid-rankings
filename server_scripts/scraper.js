// scrapes the vocaloid wiki
const fetch = require("node-fetch")
const { getAverageColorAsync } = require("./shared")
//const jsdom = require("jsdom")
  //const { JSDOM } = jsdom;// jsdom constructor

const { parseHTML } = require("linkedom")
const SongViews = require("../db/dataClasses/SongViews")
const ViewType = require("../db/enums/ViewType")
const Artist = require("../db/dataClasses/Artist")
const ArtistType = require("../db/enums/ArtistType")
const NameType = require("../db/enums/NameType")
const ArtistThumbnailType = require("../db/enums/ArtistThumbnailType")
const ArtistThumbnail = require("../db/dataClasses/ArtistThumbnail")
const Song = require("../db/dataClasses/song")
const SongType = require("../db/enums/SongType")
const ArtistCategory = require("../db/enums/ArtistCategory")
const { proxies } = require("../db/init")

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

const msInDay = 24 * 60 * 60 * 1000 // one day in ms

// entries api
const vocaDBRecentSongsApiUrl = "https://vocadb.net/api/songs?sort=AdditionDate&onlyWithPVs=true&status=Finished&fields=Names,PVs,Artists"
const vocaDBRecentSongsViewsThreshold = 10000 // how many views a recent song must have to be entered into this database
const vocaDBRecentSongsUploadDateThreshold = msInDay * 3 // (in ms) the minimum age in days of a song to be entered into this database
const vocaDBRecentSongsSearchDateThreshold = msInDay * 1 // (in ms) how many days back the getRecentSongs function searches.
const vocaDBDefaultMaxResults = 10
// song api
const vocaDBSongApiUrl = vocaDBApiUrl + "songs/"
const vocaDBSongApiParams = "?fields=Artists,Names,PVs&lang=Default"
// artists api
const vocaDBArtistsApiUrl = vocaDBApiUrl + "artists/"
const vocaDBArtistsApiParams = "?fields=Names,MainPicture"

//bilibili API
const bilibiliVideoDataEndpoint = "https://api.bilibili.com/x/web-interface/view?aid="
const bilibiliAidRegExp = /av(.+)/

// reg expressions
const vocaDbIDMatches = [
  /https:\/\/vocadb\.net\/S\/(\d+)/,
]

// functions

// exported function
  const getBilibiliData = async (videoID) => {
    const aidMatches = videoID.match(bilibiliAidRegExp)
    const trimmedAid = aidMatches ? aidMatches[1] : videoID
    const serverResponse = await fetch(bilibiliVideoDataEndpoint + trimmedAid).catch(error => {return null})
    const responseBody = serverResponse ? await serverResponse.json() : null
    if (!responseBody || responseBody.code != 0) { return {Views: 0, Thumbnail: null}; }

    const responseData =  responseBody.data
    const thumbnail = responseData.pic
    return {
      Views: responseData.stat.view,
      Thumbnail: thumbnail,
      MaxResThumbnail: thumbnail
    }
  }

  const getYouTubeData = async (videoID) => {
  
    const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoID}&key=${process.env.YoutubeAPIKey}`)

    const responseBody = await response.json()

    const items = responseBody["items"]

    const firstItem = items != undefined ? responseBody["items"][0] : null
    
    return {
      
      Views: firstItem ? Number(firstItem["statistics"]["viewCount"]) : 0,
      
      Thumbnail: `https://img.youtube.com/vi/${videoID}/hqdefault.jpg`,
      MaxResThumbnail: `https://img.youtube.com/vi/${videoID}/maxresdefault.jpg`
      
    }
    
  }

  const getNiconicoData = async (videoID) => {
    
    const serverResponse = await fetch(nicoNicoVideoDomain + videoID).catch(error => {return null})
    if (!serverResponse) { return {Views: 0, Thumbnail: null}; }
    const responseText = await serverResponse.text()
    
    const parsedHTML = parseHTML(responseText)
    // parse data-api-data
      const dataElement = parsedHTML.document.getElementById("js-initial-watch-data")
      if (!dataElement) { return {Views: 0, Thumbnail: null}; }
      
      const videoData = JSON.parse(dataElement.getAttribute("data-api-data")).video
    
    const thumbnail = videoData.thumbnail.url

    return {
      
      Views: Number(videoData.count.view),
      
      Thumbnail: thumbnail,
      MaxResThumbnail: thumbnail
      
    }
    
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
  
  const viewTypePollers = [
    getYouTubeData,
    getNiconicoData,
    getBilibiliData
  ]

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

const vocaDBArtistThumbnailMap = {
  ['urlOriginal']: ArtistThumbnailType.Original,
  ['urlThumb']: ArtistThumbnailType.Medium,
  ['urlSmallThumb']: ArtistThumbnailType.Small,
  ['urlTinyThumb']: ArtistThumbnailType.Tiny
}

  /**
   * Gets a video's views
   * 
   * @param {string[][]} videoIDs // the ids of the videos to retrieve the views of
   * @returns {SongViews}
   */
  const getVideoViewsAsync = (
    videoIDs
  ) => {
    
    return new Promise( async (resolve, reject) => {

      var totalViews = 0;

      const breakdown = []
      
      for (let [viewType, IDs] of videoIDs.entries()) {
        
        const poller = viewTypePollers[viewType]

        if (poller) {
          
          const bucket = {}
          breakdown[viewType] = bucket

          for (let [_, videoID] of IDs.entries()) {
            const views = (await poller(videoID)).Views

            bucket[videoID] = views
            totalViews += views
          }
          
        }
        
      }
      
      // resolve with the view count
      resolve(new SongViews(
        null,
        total = totalViews,
        breakdown = breakdown
      ))
    })
    
  }

  const getSongURLs = async () => {
    
    const urlMatches = {}
    
    for (let [songType, domainData] of Object.entries(scrapeDomains)) {
      
      const matches = []
      
      for (let [_, ListURL] of domainData.ListURLs.entries()) {
      
        const response = await fetch(domainData.Domain + ListURL)

        const responseText = await response.text()
        
        const parsedHTML = parseHTML(responseText)

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
  
  /**
   * Converts vocadb artist data into an Artist object.
   * 
   * @param {Object} artistData 
   * @returns {Artist}
   */
  const processVocaDBArtistData = (artistData) => {
    return new Promise(async (resolve, reject) => {
      try {
        
        // process names
        const names = [
          artistData.name
        ]
        artistData.names.forEach(nameData => {
          const nameType = NameType.map[nameData.language]
          const id = nameType && nameType.id
          const exists = id && names[id] ? true : false
          if (nameType && !exists) {
            names[id] = nameData.value
          }
        })

        // process thumbnails
        const thumbnails = []
        var averageColor = null
        
        for (const [rawType, value] of Object.entries(artistData.mainPicture || {})) {
          const type = vocaDBArtistThumbnailMap[rawType]
          if (type) {

            if (!averageColor) {
              // do this so we only have to calculate the average color of an artist's thumbnail once
              // (there are usually 4 thumbnails per artist, all the same, just downscaled from the original)
              averageColor = await getAverageColorAsync(value)
            }

            thumbnails[type.id] = new ArtistThumbnail(
              type,
              value,
              averageColor.hex
            )
          }
        }


        resolve(new Artist(
          Number.parseInt(artistData.id),
          ArtistType.map[artistData.artistType],
          null,
          artistData.releaseDate || artistData.createDate,
          new Date().toISOString(),
          names,
          thumbnails
        ))
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Takes a song's data from VocaDB and converts it into a Song object.
   * 
   * @param {Object} songData 
   * @returns {Song}
   */
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
        const artists = []
        
        for (let [_, artist] of songData.artists.entries()) {
          
          const artistCategories = artist.categories.split(",")
          
          for (let [_, category] of artistCategories.entries()) {
            category = category.trim(); // trim whitespace
            const categoryType = ArtistCategory.map[category]
            if (categoryType) {
              const artistData = artist.artist
              switch (category) {
                case "Vocalist": {
                  // update the songType
                  const artistType = artistData ? artistData.artistType : null
                  if (artistType && allowedArtistTypes[artistType]) {
                    songType = artistType
                  }
                  break; 
                }
              }

              const artistId = artistData && Number.parseInt(artist.artist.id)
              if (artistId) {
                const artistObject = await proxies.songsData.getArtist(artistId) || scrapeVocaDBArtist(artistId)

                artists.push(artistObject)
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
        var maxResThumbnail = null;
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
              const thumbnail = pollerData.Thumbnail
              if (!thumbnails[dataName]) {
                thumbnails[dataName] = thumbnail
              }

              // add maxres thumbnail
              const maxResDataName = dataName + "maxRes"
              if (!thumbnails[maxResDataName]) {
                const maxResThumb = pollerData.MaxResThumbnail
                if (thumbnail != maxResThumb) {
                  // if the thumbnail and max res thumbnails are different
                  // make sure that the max res thumbnail is a valid URL
                  const fetchResult = await fetch(maxResThumb)
                  .then(res => {
                    return res.status
                  })
                  .catch(_ => {
                    return 404
                  })
                  if (fetchResult != 404) {
                    thumbnails[maxResDataName] = maxResThumb
                  }
                }

              }
              
            }
          }
          
          // pick the thumbnail in the correct order
          for (let [_, poller] of Object.entries(vocaDBPVPolls)) {
            const dataName = poller.DataName
            const thumb = thumbnails[dataName]
            const maxResThumb = thumbnails[dataName + "maxRes"]
            if (thumb) {
              thumbnail = thumb
              maxResThumbnail = maxResThumb || thumb
              break;
            }
          }
          
        }
      
      // get the thumbnail's average color

      
      resolve(new Song(
        Number.parseInt(id),

        songData.publishDate,
        new Date().toISOString(),

        SongType.map[songType],
        
        thumbnail,
        maxResThumbnail,

        await getAverageColorAsync(maxResThumbnail),
        null,

        artists,
        names,
        videoIDs

      ))

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

  const scrapeVocaDBArtist = (artistId) => {
    return new Promise(async (resolve, reject) => {
      try {
        
      // fetch the data from the vocaDB API
      const serverResponse = await fetch(`${vocaDBArtistsApiUrl}${artistId}${vocaDBArtistsApiParams}`)
        .then(response => response.json())
        .catch(error => { reject(error); return })
      if (!serverResponse) { reject("No server response."); return; }

      resolve(processVocaDBArtistData(serverResponse))
      } catch (error) {
        reject(error)
      }
    })
  }

  const scrapeVocaDBArtistFromName = (artistName) => {
    return new Promise(async (resolve, reject) => {
      try {
        // fetch the data from the vocaDB API
        const serverResponse = await fetch(`${vocaDBArtistsApiUrl}?query=${artistName}`)
          .then(response => response.json())
          .catch(error => { reject(error); return })
        if (!serverResponse) { reject("No server response."); return; }

        const firstItem = serverResponse.items[0]

        resolve(scrapeVocaDBArtist(firstItem.id))
      } catch (error) {
        reject(error)
      }
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
        var maxAgeDate = null;

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
              maxAgeDate = new Date()
              maxAgeDate.setTime(timeNow.getTime() - vocaDBRecentSongsSearchDateThreshold)
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
          continueFetching = createDate >= maxAgeDate 

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

      const returnData = []

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
                  returnData.push({
                    songData: songData,
                    viewData: viewData
                  })
                }
                
                excludeIDs[songID] = true

              }

            }

          }

        }
      }

      resolve(returnData)
    })
  }

exports.scrapeDomains = scrapeDomains
  
exports.getVideoViewsAsync = getVideoViewsAsync
exports.getSongURLs = getSongURLs
exports.getSongData = getSongData
exports.getSongsData = getSongsData
exports.getRecentSongs = getRecentSongs

exports.scrapeVocaDB = scrapeVocaDB
exports.scrapeVocaDBArtist = scrapeVocaDBArtist
exports.scrapeVocaDBArtistFromName = scrapeVocaDBArtistFromName