// is basically a proxy for database files

// import modules
//const jsonWriter = require("./jsonWriter")
const localeTools = require("./locale")
const database = require("../db")
const { generateTimestamp } = require("./shared")

// file locations
const databaseFilePath = process.cwd() + "/database"

const databaseViewsFilePath = databaseFilePath + "/views"
const databaseSongsDataFilePath = databaseFilePath + "/songsData.txt"
const databaseViewsMetadataFilePath = databaseFilePath + "/viewsMetadata.txt"

// tables
  const rankingsFilterQueryTemplate = {
  
    MaxEntries: 50, // the maximum # of entries to return
    StartAt: 0, // the maximum # of entries to return
    
    Date: "",
    DaysOffset: 0,

    ViewType: "Combined",

    Producer: "",
    Singer: "",
    SongType: "All",

    TimePeriod: "AllTime",
    Direction: "Descending",
    SortBy: "Views",

    Language: "Original",

    PublishYear: "",

  }
  
  const historicalDataQueryTemplate = {
    
    Range: 7, // the default range (how many data points will exist)
    
    TimePeriod: "Daily", // the time period
    
    SongId: "",
    
  }
  
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

  return new Promise( async (resolve, reject) => {
    
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
  return new Promise( async (resolve, reject) => {
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
  
  return new Promise ( async (resolve, reject) => {
    
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
    const previousMetadataIndex = Math.max(0,(currentMetadataIndex - 1) - timePeriodOffset)
    
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
      views = viewBreakdown ? viewBreakdown: views
    }

    toSubtractViews[viewData.songId] = views
      
  }
  
  // subtract
  for (let [_, viewData] of viewsData.Data.entries() ) {
    
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
  
  return new Promise (async ( resolve, reject ) => {
    
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

const filterRankingsSQL = (queryData, offset) => {
  return new Promise( async (resolve, reject) => {
    try {

      // merge queryData
      queryData = {...rankingsFilterQueryTemplate, ...(queryData || {})}

      // get the days offset and queryDate
      const daysOffset = Math.max(0, offset || Number(queryData.DaysOffset) || 0)
      const queryDate = queryData.Date
      const filterDate = queryDate == "" ? null : queryDate

      //getViewsDataTimestamp()
      const filterTimePeriod = queryData.TimePeriod
      const timePeriodOffset = rankingsFilterTimePeriodOffsets[filterTimePeriod]

      const primaryTimestamp = await getViewsDataTimestamp(filterDate, daysOffset)
      const timePeriodTimestamp = timePeriodOffset ? await getViewsDataTimestamp(filterDate, daysOffset + timePeriodOffset) : null

      const rankings = await database.views.filterRankings(queryData, primaryTimestamp, timePeriodTimestamp)

      resolve({
        QueryData: queryData,
        Timestamp: primaryTimestamp,
        Data: rankings || [],
        Length: await database.views.getViewsLength(primaryTimestamp),
      })

    } catch (error) {
      reject(error)
    }
  })
}

const filterRankingsWithChange = (queryData, offset) => {
  // filters rankings, but gets the current day & the previous day, comparing placements between them
  return new Promise( async (resolve, reject) => {
    
    
    const daysOffset = offset || Number(queryData.DaysOffset) || 0
    
    //const sqlData = filterRankingsSQL(queryData, daysOffset)

    const currentData = filterRankingsSQL(queryData, daysOffset)
                        .catch(error => reject(error))
    const previousData = filterRankingsSQL(queryData, daysOffset + 1)
                        .catch(error => reject(error))
    
    const promiseData = await Promise.allSettled([currentData, previousData])
    
    const filteredRankings = []
    const previousRankings = {}
    
    // parse previous rankings
    for (let [index, songData] of promiseData[1].value.Data.entries()) {
      previousRankings[songData.songId] = index
    }
    
    for (let [index, songData] of promiseData[0].value.Data.entries()) {
      
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
  return new Promise( async (resolve, reject) => {
    // merge queryData
    queryData = {...historicalDataQueryTemplate, ...(queryData || {})}
    
    // get metadata
    const viewsMetadata = await database.views.getMetadata()
    const metadataLength = viewsMetadata.length - 1
    
    // parse queryData
    const queryRange = Math.min(historicalDataQueryTemplate.Range, queryData.Range)
    const queryTimePeriodOffset = rankingsFilterTimePeriodOffsets[queryData.TimePeriod]
    const querySongID = queryData.SongId
    
    if (!queryTimePeriodOffset) { reject("Invalid time period '" + queryData.TimePeriod + "' was provided."); return; }// make sure that the time period was valid
    
    const songViews = []
    
    for (let i=0; i<queryRange+1; i++) {
      const index = Math.max(0, metadataLength - (i*queryTimePeriodOffset))
      
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

  } else if(!status && exists) {

    databaseUpdating = null

  }
}

const setUpdatingProgress = (newProgress) => {
  // updates the updating progress
  if (!databaseUpdating) { return }

  databaseUpdating.progress = Math.min(1,newProgress)

}

// export variables
exports.viewsDataSortingFunctions = viewsDataSortingFunctions
exports.rankingsFilterQueryTemplate = rankingsFilterQueryTemplate
exports.historicalDataQueryTemplate = historicalDataQueryTemplate


// export functions
exports.getSongData = getSongData
exports.getHistoricalData = getHistoricalData
exports.filterRankingsWithChange = filterRankingsWithChange

exports.getUpdating = getUpdating
exports.setUpdating = setUpdating
exports.setUpdatingProgress = setUpdatingProgress