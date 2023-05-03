// is basically a proxy for database files

// import modules
//const jsonWriter = require("./jsonWriter")
const localeTools = require("./locale")
const database = require("../db")
const { getAverageColorAsync, generateTimestamp, verifyParams, rankingsFilterQueryTemplate, historicalDataQueryTemplate } = require("./shared")
const { argbFromHex, themeFromSourceColor, hexFromArgb } = require("@importantimport/material-color-utilities");
const scraper = require("./scraper")
const Song = require("../db/dataClasses/song")
const SongType = require("../db/enums/SongType")
const Artist = require("../db/dataClasses/Artist")
const ArtistType = require("../db/enums/ArtistType")
const NameType = require("../db/enums/NameType")
const ViewType = require("../db/enums/ViewType")
const ArtistThumbnailType = require("../db/enums/ArtistThumbnailType")
const ArtistThumbnail = require("../db/dataClasses/ArtistThumbnail")
const EntityViews = require("../db/dataClasses/EntityViews")
const ArtistCategory = require("../db/enums/ArtistCategory")
const VideoViews = require("../db/dataClasses/VideoViews");
const ArtistsRankingsFilterParams = require("../db/dataClasses/ArtistsRankingsFilterParams");
const FilterDirection = require("../db/enums/FilterDirection");
const FilterOrder = require("../db/enums/FilterOrder");
const RankingsFilterParams = require("../db/dataClasses/RankingsFilterParams");
const SearchQueryParams = require("../db/dataClasses/SearchQueryParams");

// file locations
const databaseFilePath = process.cwd() + "/database"

const databaseViewsFilePath = databaseFilePath + "/views"
const databaseSongsDataFilePath = databaseFilePath + "/songsData.txt"
const databaseViewsMetadataFilePath = databaseFilePath + "/viewsMetadata.txt"

// tables


const viewsDataSortByFunctions = {

  UploadDate: (a, b) => {

    const aDate = new Date(a.songData.publishDate) || new Date()
    const bDate = new Date(b.songData.publishDate) || new Date()

    return bDate - aDate

  },

  AdditionDate: (a, b) => {

    const aDate = new Date(a.songData.additionDate) || new Date()
    const bDate = new Date(b.songData.additionDate) || new Date()

    return bDate - aDate

  }

}

const viewsDataSortingFunctions = {

  Descending: (a, b) => {

    return b.total - a.total

  },
  Ascending: (a, b) => {

    return a.total - b.total

  },
}

const rankingsFilterTimePeriodOffsets = {

  Daily: 1,
  Weekly: 7,
  Monthly: 30,

}

const changeStatusEnum = {
  UP: 'UP',
  SAME: 'SAME',
  DOWN: 'DOWN',
}

// functions

const getMostRecentViewsTimestamp = (date, offset) => {

  const indexOffset = offset || 0

  return new Promise(async (resolve, reject) => {

    const viewsMetadata = await database.views.getMetadata()
    var startAt = viewsMetadata.length - 1

    if (date) {
      // find new start at

      for (let [n, metadata] of viewsMetadata.entries()) {

        if (metadata.timestamp == date) {
          startAt = n
          break
        }

      }

    }

    // get the most recent views file
    const mostRecentMetadata = viewsMetadata[Math.max(0, startAt - indexOffset)] // get the last index (most recent views file)

    resolve(mostRecentMetadata ? mostRecentMetadata.timestamp : null)

  })

}

const getViewsDataTimestamp = (date, offset) => {
  return new Promise(async (resolve, reject) => {
    try {
      const timestampData = await database.views.getMetadataTimestamp(date, offset)
      if (!timestampData || timestampData == undefined) { reject(null) }

      resolve(timestampData.timestamp)
    } catch (error) {
      reject(error)
    }
  })
}

const getMostRecentViewsData = (date, offset) => {

  const indexOffset = offset || 0

  return new Promise(async (resolve, reject) => {

    const viewsMetadata = await database.views.getMetadata()
    var startAt = viewsMetadata.length - 1

    if (date) {
      // find new start at

      for (let [n, metadata] of viewsMetadata.entries()) {

        if (metadata.timestamp == date) {
          startAt = n
          break
        }

      }

    }

    // get the most recent views file
    const mostRecentMetadata = viewsMetadata[Math.max(0, startAt - indexOffset)] // get the last index (most recent views file)
    if (!mostRecentMetadata) { reject("No views data available."); return; }

    const mostRecentTimestamp = mostRecentMetadata.timestamp
    const mostRecentViewsData = await database.views.getViewsData(mostRecentTimestamp)

    resolve({

      Content: mostRecentViewsData,
      Timestamp: mostRecentTimestamp,
      Updated: mostRecentMetadata.updated,
      MetadataLength: startAt + 1

    })

  })

}

const rankingsFilterTimePeriodFilter = async (timePeriodOffset, viewsData, sortFunction) => {

  // filter views by time period 
  const viewsMetadata = await database.views.getMetadata()

  const currentMetadataIndex = viewsData.MetadataIndex

  // get the most recent views file
  const previousMetadataIndex = Math.max(0, (currentMetadataIndex - 1) - timePeriodOffset)

  const mostRecentMetadata = viewsMetadata[previousMetadataIndex] // get the last index (most recent views file)
  const mostRecentTimestamp = mostRecentMetadata && mostRecentMetadata.timestamp

  if (!mostRecentTimestamp || (previousMetadataIndex == currentMetadataIndex)) { return viewsData; }

  // get the views data
  const mostRecentViewsData = await database.views.getViewsData(mostRecentTimestamp)
  if (!mostRecentViewsData || mostRecentTimestamp.updated == viewsData.Timestamp) { return viewsData; }

  // filter
  const toSubtractViews = {}

  const filterViewType = viewsData.QueryData.ViewType
  const isCombined = filterViewType == "Combined"

  for (let [_, viewData] of mostRecentViewsData.entries()) {

    var views = viewData.total

    if (!isCombined) {
      const breakdown = JSON.parse(viewData.breakdown)
      const viewBreakdown = breakdown[filterViewType]
      views = viewBreakdown ? viewBreakdown : views
    }

    toSubtractViews[viewData.songId] = views

  }

  // subtract
  for (let [_, viewData] of viewsData.Data.entries()) {

    const totalViews = isCombined ? viewData.total : viewData.breakdown[filterViewType]

    const subtractAmount = toSubtractViews[viewData.songId] || totalViews

    viewData.total = totalViews - subtractAmount

  }

  //sort
  viewsData.Data.sort(sortFunction)

  return viewsData

}

// exported functions

const getSongData = (songID) => {
  // gets a song's data & view data and puts them in one object

  return new Promise(async (resolve, reject) => {

    const mostRecentViewsTimestamp = await getViewsDataTimestamp(generateTimestamp()).catch(error => { reject(error); return })
    if (!mostRecentViewsTimestamp) { return }

    // get the song data
    const songData = await database.songs.getSong(songID)
    if (!songData) { reject("Song with ID '" + songID + "' not found.'"); return; }

    // find views
    songData.views = await database.views.getViewData(mostRecentViewsTimestamp, songID) || {}

    resolve(songData)

  })

}

/**
 * Filters rankings using SQLite
 * 
 * @param {Object} queryData The query data to filter with.
 * @param {Object} options The options to provide to the function. Template: {offset: Number, limitResult = Boolean}
 * @returns 
 */
const filterRankingsSQL = (queryData, options = {}) => {
  return new Promise(async (resolve, reject) => {
    try {

      // merge queryData
      queryData = verifyParams(queryData || {}, rankingsFilterQueryTemplate)

      // handle options
      if (options.limitResult == false) {
        delete queryData.MaxEntries
      }

      // get the days offset and queryDate
      const daysOffset = Math.max(0, options.offset || Number(queryData.DaysOffset) || 0)
      const queryDate = queryData.Date
      const filterDate = queryDate == "" ? null : queryDate

      //getViewsDataTimestamp()
      const filterTimePeriod = queryData.TimePeriod
      const timePeriodOffset = rankingsFilterTimePeriodOffsets[filterTimePeriod]

      const primaryTimestamp = await getViewsDataTimestamp(filterDate, daysOffset)
      const timePeriodTimestamp = timePeriodOffset ? await getViewsDataTimestamp(filterDate, daysOffset + timePeriodOffset) : null

      const rankings = await database.views.filterRankings(queryData, primaryTimestamp, timePeriodTimestamp, options)

      resolve({
        QueryData: queryData,
        Timestamp: primaryTimestamp,
        Data: (rankings == null) || (rankings == undefined) ? [] : rankings.data,
        Length: rankings.length,
      })

    } catch (error) {
      reject(error)
    }
  })
}

const filterRankingsWithChange = (queryData, options = {}) => {
  // filters rankings, but gets the current day & the previous day, comparing placements between them
  return new Promise(async (resolve, reject) => {
    const daysOffset = options.offset || Number(queryData.DaysOffset) || 0

    const currentData = filterRankingsSQL(queryData, { offset: daysOffset, ...options })
      .catch(error => reject(error))
    const previousData = filterRankingsSQL(queryData, { offset: daysOffset + 1, ...options })
      .catch(error => reject(error))

    const promiseData = await Promise.allSettled([currentData, previousData])

    const currentRankingsData = promiseData[0].value
    const previousRankingsData = promiseData[1].value

    if (currentRankingsData == undefined || previousRankingsData == undefined) { return }

    const previousRankings = {}

    // parse previous rankings
    for (const [index, songData] of previousRankingsData.Data.entries()) {
      previousRankings[songData.songId] = index
    }

    for (const [index, songData] of currentRankingsData.Data.entries()) {

      const previousPos = previousRankings[songData.songId]

      songData.previousPosition = previousPos

      const change = previousPos != null ? index > previousPos ? 1 : previousPos > index ? -1 : 0 : -1

      songData.change = {
        previous: previousPos,
        status: 0 > change ? changeStatusEnum.UP : change > 0 ? changeStatusEnum.DOWN : changeStatusEnum.SAME
      }

    }

    resolve(promiseData[0].value)
  })

}

const getHistoricalData = (queryData) => {
  return new Promise(async (resolve, reject) => {
    // merge queryData
    queryData = verifyParams(queryData || {}, historicalDataQueryTemplate)

    // get metadata
    const viewsMetadata = await database.views.getMetadata()
    const metadataLength = viewsMetadata.length - 1

    // parse queryData
    const queryRange = queryData.Range
    const queryTimePeriodOffset = rankingsFilterTimePeriodOffsets[queryData.TimePeriod]
    const querySongID = queryData.SongId

    if (!queryTimePeriodOffset) { reject("Invalid time period '" + queryData.TimePeriod + "' was provided."); return; }// make sure that the time period was valid

    const songViews = []

    for (let i = 0; i < queryRange + 1; i++) {
      const index = Math.max(0, metadataLength - (i * queryTimePeriodOffset))

      const metadata = viewsMetadata[index]
      const timestamp = metadata.timestamp
      if (!timestamp) { break }

      await database.views.getViewData(timestamp, querySongID).then(viewData => {
        songViews.push({
          timestamp: timestamp,
          ...viewData
        })
      }).catch(error => {
        songViews.push({
          timestamp: timestamp,
          total: 0,
          breakdown: {}
        })
      })

      if (index == 0) { break; }

    }

    // now subtract
    const subtractedViews = []

    for (let i = 0; i < songViews.length; i++) {

      const current = songViews[i]
      const next = songViews[i + 1]

      if (current && next) {

        let totalViews = 0
        const breakdown = {}
        // subtract breakdown 
        for (let [viewType, views] of Object.entries(next.breakdown)) {

          const breakdownSubbed = Math.abs(views - (current.breakdown[viewType] || 0))

          totalViews += breakdownSubbed

          breakdown[viewType] = breakdownSubbed

        }


        subtractedViews.push({

          timestamp: current.timestamp,

          total: totalViews,

          breakdown: breakdown,

        })

      }

    }

    resolve(subtractedViews)

  })
}

var databaseUpdating = null;

const getUpdating = () => {
  // returns whether the database is updating
  return databaseUpdating
}

const setUpdating = (status) => {
  // sets whether or not the database is updating
  const exists = databaseUpdating ? true : false

  if (status && !exists) {

    databaseUpdating = {
      progress: 0
    }

  } else if (!status && exists) {

    databaseUpdating = null

  }
}

const setUpdatingProgress = (newProgress) => {
  // updates the updating progress
  if (!databaseUpdating) { return }

  databaseUpdating.progress = Math.min(1, newProgress)

}

// add song stuff
const addSongFromScraperData = (timestamp, songData = {}, viewData = {}, artistsData) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (artistsData == undefined) {
        // load artists data from songData
        await addArtistsFromIds([...songData.singers, ...songData.producers])
      } else {
        await database.artists.addArtists(artistsData)
      }

      await database.songs.insertSong(songData.songId, songData)
      await database.views.insertViewData(timestamp, viewData)

      resolve()
    } catch (error) {
      reject(error)
    }
  })
}

// artists stuff
const addArtistsFromIds = (ids = []) => {
  return new Promise(async (resolve, reject) => {
    try {
      const artistsProxy = database.artists
      const artistExists = artistsProxy.artistExists
      const addArtist = artistsProxy.addArtist

      for (const [_, id] of ids.entries()) {
        // check if artist is already in database
        if (!(await artistExists(id))) {
          // scrape
          await scraper.scrapeVocaDBArtist(id).then(artistData => {
            // if the row doesn't exist already create it.
            return addArtist(artistData)
          }).catch(error => console.error(`Error when trying to import artist with id "${id}" Error: ${error}`))
        }
      }
      resolve(ids)
    } catch (error) {
      console.log(error)
      reject(error)
    }
  })
}

const populateArtists = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const jsonStringify = JSON.stringify

      const songs = await database.songs.getSongs()
      const length = songs.length - 1
      for (const [n, songData] of songs.entries()) {
        const songId = songData.songId
        console.log(`${songData.songId} [${n}/${length}]`)

        // get song data from scraper
        await scraper.scrapeVocaDB(Number(songId)).then(async newSongData => {
          await database.songs.updateSong(songId, ["singers", "producers"], [
            jsonStringify(await addArtistsFromIds(newSongData.singers)),
            jsonStringify(await addArtistsFromIds(newSongData.producers))
          ])
        }).catch(error => console.error(`Error when trying to get data from song with id "${songId}" Error: ${error}`))
      }

      resolve()
    } catch (error) {
      reject(error)
    }
  })
}

const repairSongThumbnails = () => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("Repairing song thumbnails...")

      const songs = await database.songs.getSongs()
      const length = songs.length

      for (const [n, song] of songs.entries()) {
        const songId = song.songId
        const thumbnail = song.thumbnail
        if (thumbnail.startsWith("//")) {
          console.log(`[${n}/${length}] Repairing ${songId}...`)
          await database.songs.updateSong(songId, ["thumbnail"], ["https:" + thumbnail])
        }
      }
      console.log("Song thumbnails repaired.")
      resolve()
    } catch (error) {
      reject(error)
    }
  })
}

/*
songId TEXT PRIMARY KEY NOT NULL, 
songType TEXT NOT NULL, 
singers JSON NOT NULL, 
producers JSON NOT NULL, 
publishDate TEXT NOT NULL, 
additionDate TEXT NOT NULL, 
thumbnail TEXT NOT NULL, 
names JSON NOT NULL, 
videoIds JSON NOT NULL, 
fandomURL TEXT
*/

const migrateViewsData = () => {
  return new Promise(async (resolve, reject) => {
    try {
      console.time("Migration")
      console.log("------------- MIGRATING VIEWS DATA -------------")

      const viewTypeMap = ViewType.map
      const songsDataProxy = database.songsDataProxy

      const artistTypeMap = {
        'Vocaloid': ArtistType.Vocaloid,
        'CeVIO': ArtistType.CeVIO,
        'SynthesizerV': ArtistType.SynthesizerV,
        'Illustrator': ArtistType.Illustrator,
        'CoverArtist': ArtistType.CoverArtist,
        'Animator': ArtistType.Animator,
        'Producer': ArtistType.Producer,
        'OtherVocalist': ArtistType.OtherVocalist,
        'OtherVoiceSynthesizer': ArtistType.OtherVoiceSynthesizer,
        'OtherIndividual': ArtistType.OtherIndividual,
        'OtherGroup': ArtistType.OtherGroup,
        'UTAU': ArtistType.UTAU
      }

      const songThumbnailTypeRegExps = [
        {
          regExp: /https:\/\/img\.youtube\.com\/vi\/([^\/\\]+)\/hqdefault\.jpg/,
          type: ViewType.YouTube
        },
        {
          regExp: /https:\/\/nicovideo\.cdn\.nimg\.jp\/thumbnails\/.+/,
          type: ViewType.Niconico
        },
        {
          regExp: /http:\/\/i\d\.hdslb\.com\/bfs\/archive.+/,
          type: ViewType.bilibili
        }
      ]

      // migrate songs
      console.log("----[ Migrating Songs ]----")
      const insertDelay = 5000 // in ms, the delay between song insertions

      const sleep = (time) => {
        return new Promise((resolve, reject) => {
          setTimeout(resolve, time)
        })
      }

      const songsMap = {}
      {
        const songs = await database.songs.getSongs()
        const songCount = songs.length

        for (const [n, song] of songs.entries()) {
          const songId = song.songId
          const numberSongID = Number.parseInt(songId)
          if (await songsDataProxy.songExists(numberSongID)) {
            const song = await songsDataProxy.getSong(numberSongID)
            if (song && song != null && song != undefined) {
              songsMap[songId] = song
            }
          } else {
            console.timeLog('Migration', `[${n}/${songCount}] Migrating song with id "${songId}".`)
            // build song
            const newSong = await scraper.scrapeVocaDBSongAsync(numberSongID)
              .catch(err => { return null })
            if (newSong && newSong != null && newSong != undefined && newSong.thumbnail) {
              newSong.views = null

              await songsDataProxy.insertSong(newSong)
              songsMap[songId] = newSong
              await sleep(insertDelay)
            }
          }
        }
      }

      // migrate views
      console.log("----[ Migrating Views ]----")
      {
        const metadata = await database.views.getMetadata()

        for (const [_, timestampData] of metadata.entries()) {
          const timestamp = timestampData.timestamp
          songsDataProxy.insertViewsTimestamp(timestamp, timestampData.updated)

          console.log("Migrate views for", timestamp)

          // get views data
          const viewsData = await database.views.getViewsData(timestamp)
          if (viewsData) {

            for (const [_, viewData] of viewsData.entries()) {
              const songId = viewData.songId
              const songData = songsMap[songId]
              if (songData) {
                // process breakdown
                const oldBreakdown = JSON.parse(viewData.breakdown)
                const newBreakdown = []

                for (const [platform, views] of Object.entries(oldBreakdown)) {
                  const viewType = viewTypeMap[platform.toLowerCase()]
                  if (viewType) {
                    const viewTypeId = viewType.id
                    const songVideoIdBucket = songData.videoIds[viewTypeId]
                    const songVideoId = songVideoIdBucket && songVideoIdBucket[0]
                    if (songVideoId) {
                      newBreakdown[viewType.id] = [
                        new VideoViews(
                          songVideoId,
                          views
                        )
                      ]
                    }
                  }
                }

                songsDataProxy.insertSongViews(
                  songId,
                  new EntityViews(
                    timestamp,
                    viewData.total,
                    newBreakdown
                  )
                )
              }

            }

          }
        }

      }

      console.log("------------- MIGRATING VIEWS DATA COMPLETE -------------")
      console.timeEnd("Migration")
      resolve()
    } catch (error) {
      console.log("Error occurred when migrating views data. Error:", error)
      reject(error)
    }
  })
}
const migrateViewsDataOld = () => {
  return new Promise(async (resolve, reject) => {
    try {
      console.time("migration took")
      console.log("------------- MIGRATING VIEWS DATA -------------")

      const viewTypeMap = ViewType.map
      const songsDataProxy = database.songsDataProxy

      const artistTypeMap = {
        'Vocaloid': ArtistType.Vocaloid,
        'CeVIO': ArtistType.CeVIO,
        'SynthesizerV': ArtistType.SynthesizerV,
        'Illustrator': ArtistType.Illustrator,
        'CoverArtist': ArtistType.CoverArtist,
        'Animator': ArtistType.Animator,
        'Producer': ArtistType.Producer,
        'OtherVocalist': ArtistType.OtherVocalist,
        'OtherVoiceSynthesizer': ArtistType.OtherVoiceSynthesizer,
        'OtherIndividual': ArtistType.OtherIndividual,
        'OtherGroup': ArtistType.OtherGroup,
        'UTAU': ArtistType.UTAU
      }

      const songThumbnailTypeRegExps = [
        {
          regExp: /https:\/\/img\.youtube\.com\/vi\/([^\/\\]+)\/hqdefault\.jpg/,
          type: ViewType.YouTube
        },
        {
          regExp: /https:\/\/nicovideo\.cdn\.nimg\.jp\/thumbnails\/.+/,
          type: ViewType.Niconico
        },
        {
          regExp: /http:\/\/i\d\.hdslb\.com\/bfs\/archive.+/,
          type: ViewType.bilibili
        }
      ]

      // migrate songs
      console.log("----[ Migrating Songs ]----")
      const songsMap = {}
      const artistsMap = {}
      {
        const songs = await database.songs.getSongs()
        const length = songs.length

        for (const [n, song] of songs.entries()) {
          const songId = song.songId
          const numberSongId = Number.parseInt(songId)
          console.log(`[${n}/${length}] Migrating ${songId}...`)
          if (await songsDataProxy.songExists(numberSongId)) {
            songsMap[songId] = await songsDataProxy.getSong(numberSongId)
            continue
          }
          // create song
          const thumbnail = song.thumbnail
          let maxresThumbnail = thumbnail

          // get thumbnail type
          let thumbnailType = ViewType.YouTube
          for (const [_, regExpData] of songThumbnailTypeRegExps.entries()) {
            const match = thumbnail.match(regExpData.regExp)
            const viewType = regExpData.type
            if (match) {
              thumbnailType = viewType
              if (viewType == ViewType.YouTube) {
                maxresThumbnail = `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`
                // test the maxres thumbnail
                const fetchResult = await fetch(maxresThumbnail)
                  .then(res => {
                    return res.status
                  })
                  .catch(_ => {
                    return 404
                  })
                if (fetchResult == 404) {
                  maxresThumbnail = thumbnail
                }
              }
              break
            }
          }
          // get average color
          const averageColor = (await getAverageColorAsync(maxresThumbnail)).hex

          // process dark and light colors
          // Get the theme from a hex color
          const theme = themeFromSourceColor(argbFromHex(averageColor));

          const colorSchemes = theme.schemes

          // get artists
          const processedArtists = []
          const thumbnailTypeMap = {
            ["original"]: ArtistThumbnailType.Original,
            ["medium"]: ArtistThumbnailType.Medium,
            ["small"]: ArtistThumbnailType.Small,
            ["tiny"]: ArtistThumbnailType.Tiny
          }
          const processArtists = async (artists, category) => {
            for (const [_, artistId] of artists.entries()) {
              const existsInMap = artistsMap[artistId + category.id]
              if (existsInMap) {
                processedArtists.push(existsInMap)
              } else {
                const artistData = await database.artists.getArtist(artistId)
                if (artistData) {
                  // process names
                  const names = artistData.names
                  const processedNames = []
                  processedNames[NameType.Original.id] = names["Original"]
                  processedNames[NameType.Japanese.id] = names["Japanese"]
                  processedNames[NameType.English.id] = names["English"]
                  processedNames[NameType.Romaji.id] = names["Romaji"]

                  // process thumbnails
                  const thumbnails = artistData.thumbnails
                  let artistAverageColor = null
                  const processedThumbnails = []
                  for (const [original, mapped] of Object.entries(thumbnailTypeMap)) {
                    const url = thumbnails[original]
                    if (url) {
                      if (!artistAverageColor) {
                        artistAverageColor = (await getAverageColorAsync(url)).hex
                      }
                      processedThumbnails[mapped.id] = new ArtistThumbnail(
                        mapped,
                        url
                      )
                    } else {
                      thumbnails[mapped.id] = null
                    }
                  }

                  artistAverageColor = artistAverageColor || "#ffffff"

                  const artistTheme = themeFromSourceColor(argbFromHex(artistAverageColor))
                  const artistColorSchemes = artistTheme.schemes

                  const newArtist = new Artist(
                    Number.parseInt(artistId),
                    artistTypeMap[artistData.artistType] || ArtistType.Producer,
                    category,
                    artistData.publishDate,
                    artistData.additionDate,
                    processedNames,
                    processedThumbnails,
                    null,
                    artistAverageColor,
                    hexFromArgb(artistColorSchemes.dark.props.primary),
                    hexFromArgb(artistColorSchemes.light.props.primary),
                  )

                  artistsMap[artistId + category.id] = newArtist
                  processedArtists.push(newArtist)
                } else {
                  console.log("Couldn't load artist with ID ", artistId)
                }
              }
            }
          }
          // process artists
          await processArtists(JSON.parse(song.singers), ArtistCategory.Vocalist)
          await processArtists(JSON.parse(song.producers), ArtistCategory.Producer)

          // build names
          const songNames = JSON.parse(song.names)
          const processedSongNames = []
          processedSongNames[NameType.Original.id] = songNames["Original"]
          processedSongNames[NameType.Japanese.id] = songNames["Japanese"]
          processedSongNames[NameType.English.id] = songNames["English"]
          processedSongNames[NameType.Romaji.id] = songNames["Romaji"]

          // build video ids
          const videoIds = JSON.parse(song.videoIds)
          const processedVideoIds = []
          for (const [viewType, ids] of Object.entries(videoIds)) {
            processedVideoIds[viewTypeMap[viewType.toLowerCase()].id] = ids
          }

          // build song
          const newSong = new Song(
            numberSongId,
            song.publishDate,
            song.additionDate,
            SongType.Original,
            thumbnail,
            maxresThumbnail,
            averageColor,
            hexFromArgb(colorSchemes.dark.props.primary),
            hexFromArgb(colorSchemes.light.props.primary),
            song.fandomURL,
            processedArtists,
            processedSongNames,
            processedVideoIds,
            null,
            null,
            thumbnailType
          )

          await songsDataProxy.insertSong(newSong)
          songsMap[songId] = newSong
        }
      }

      // migrate views
      console.log("----[ Migrating Views ]----")
      {
        const metadata = await database.views.getMetadata()

        for (const [_, timestampData] of metadata.entries()) {
          const timestamp = timestampData.timestamp
          songsDataProxy.insertViewsTimestamp(timestamp, timestampData.updated)

          console.log("Migrate views for", timestamp)

          // get views data
          const viewsData = await database.views.getViewsData(timestamp)
          if (viewsData) {

            for (const [_, viewData] of viewsData.entries()) {
              const songId = viewData.songId
              const songData = songsMap[songId]
              // process breakdown
              const oldBreakdown = JSON.parse(viewData.breakdown)
              const newBreakdown = []

              for (const [platform, views] of Object.entries(oldBreakdown)) {
                const viewType = viewTypeMap[platform.toLowerCase()]
                if (viewType) {
                  const viewTypeId = viewType.id
                  const songVideoIdBucket = songData.videoIds[viewTypeId]
                  const songVideoId = songVideoIdBucket && songVideoIdBucket[0]
                  if (songVideoId) {
                    newBreakdown[viewType.id] = [
                      new VideoViews(
                        songVideoId,
                        views
                      )
                    ]
                  }
                }
              }

              songsDataProxy.insertSongViews(
                songId,
                new EntityViews(
                  timestamp,
                  viewData.total,
                  newBreakdown
                )
              )
            }

          }
        }

      }

      console.log("------------- MIGRATING VIEWS DATA COMPLETE -------------")
      console.timeEnd("migration took")
      resolve()
    } catch (error) {
      console.log("Error occurred when migrating views data. Error:", error)
      reject(error)
    }
  })
}
//migrateViewsDataOld()
//migrateViewsData()

// export variables
exports.viewsDataSortingFunctions = viewsDataSortingFunctions


// export functions
exports.getSongData = getSongData
exports.getHistoricalData = getHistoricalData
exports.filterRankings = filterRankingsSQL
exports.filterRankingsWithChange = filterRankingsWithChange

exports.addSongFromScraperData = addSongFromScraperData
exports.repairSongThumbnails = repairSongThumbnails

exports.getUpdating = getUpdating
exports.setUpdating = setUpdating
exports.setUpdatingProgress = setUpdatingProgress

//artists functions
exports.addArtistsFromIds = addArtistsFromIds
exports.populateArtists = populateArtists

/*database.songsDataProxy.filterRankings(new RankingsFilterParams(
  null, // timestamp
  1, // time period offset
  null, // change offset
  null, // days offset
  null, // view type
  null, // song type
  null, // artist type
  null, // publish date
  null, // filter order
  FilterDirection.Descending, // filter direction
  null, // artists
  null, // single video
  10000, // max entries
  0, // start at
  null,//[130889], // songs
  null, // min views
  null, // max views
  null // count mode
)).then(result => {
  
  var total_daily_views = 10000000
  const resultCount = result.totalCount
  /*result.results.forEach(resultItem => {
    total_daily_views += resultItem.views
  });

  const historicalAvg = total_daily_views / resultCount

  var standardDeviationSum = 0

  result.results.forEach(resultItem => {
    standardDeviationSum += Math.pow(resultItem.views - historicalAvg, 2)
  })

  const historicalStandardDeviation = Math.sqrt(standardDeviationSum / total_daily_views)

  const getZScore = (views) => {
    return (views - historicalAvg) / historicalStandardDeviation
  }

  const zScores = []

  result.results.forEach(resultItem => {
    zScores.push({
      id: resultItem.song.id,
      name: resultItem.song.names[2],
      zScore: getZScore(resultItem.views),
    })
  })
  zScores.sort((a,b) => {
    return b.zScore - a.zScore
  })

  console.log(zScores)

})*/

/*setTimeout(() => {
  console.time('filtered rankings')
  database.songsDataProxy.filterRankings(new RankingsFilterParams(
    null, // timestamp
    null, // time period offset
    null, // change offset
    null, // days offset
    null, // view type
    null, // song type
    null, // artist type
    null, // publish date
    null, // filter order
    null, // filter direction
    null, // artists
    null, // single video
    1, // max entries
    0, // start at
    [130889], // songs
    null, // min views
    null, // max views
    null // count mode
  )).then(result => {
    
    const views = result.results[0].views
    const filter = new RankingsFilterParams()
    filter.minViews = views

    database.songsDataProxy.filterRankings(filter).then(finalResult => {
      console.timeEnd('filtered rankings')
      console.log(finalResult.totalCount)
    })
  })
}, 1000)*/
/*setTimeout(() => {
  console.time("filtered artists")
  database.songsDataProxy.filterArtistsRankings(new ArtistsRankingsFilterParams(
    null, // timestamp
    1, // time period offset
    null, // change offset
    null, // days offset
    null, // view type
    null, // song type
    null, // artist type
    null, // ArtistCategory.Vocalist,
    null, // publish date
    FilterOrder.Views, // filter order
    FilterDirection.Descending, // filter direction
    null, // songs
    null,//'', // single video
    50, // max entires
    0, // start at
  )).then(result => {
    console.timeEnd("filtered artists")
    result.results.forEach(resultItem => {
      console.log(resultItem.artist.id, resultItem.artist.names[0], resultItem.views)
    });
  })
}, 1000)*/
/*setTimeout(() => {
  console.time("search query")
  database.songsDataProxy.searchQuery(new SearchQueryParams(
    'かご め'
  )).then(result => {
    console.timeEnd("search query")
    console.log("total: " + result.totalCount)
    result.results.forEach(resultItem => {
      console.log(resultItem.placement, resultItem.type.name, resultItem.data.id, resultItem.distance)
    })
  })
}, 1000)*/