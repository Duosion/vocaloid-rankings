const workingDirectory = process.cwd()
const modulePath = workingDirectory + "/server_scripts/"

// import
const { getAverageColor } = require("fast-average-color-node")

const database = require(workingDirectory + "/db")
const databaseProxy = require(modulePath + "/database")

const { longFormat } = require(modulePath + "/unitConverter")
const { viewTypes, getHasherAsync, caches, rankingsFilterQueryTemplate, getRandomInt } = require(modulePath + "shared") // shared functions
const { getPreferredLanguageName } = require(modulePath + "/locale")

// implement caches
const rankingsCache = caches.rankingsCache // initialize rankings cache with a 120 second lifespan
const highlightsCache = caches.highlightsCache // gets the highlights cache with a lifespan of 1 hour

// variables
const filterPageOptions = {
    ViewType: {
      DisplayName: "View Type",
      Values: {
        "Combined": {
          DisplayName: "Combined",
          Default: true
        },
        "YouTube": {
          DisplayName: "YouTube"
        },
        "Niconico": {
          DisplayName: "Niconico"
        },
        "bilibili": {
          DisplayName: "bilibili"
        }
      }
    },
    TimePeriod: {
      DisplayName: "Time Period",
      Values: {
        "AllTime": {
          DisplayName: "All Time",
          Default: true
        },
        "Daily": {
          DisplayName: "Past Day"
        },
        "Weekly": {
          DisplayName: "Past Week"
        },
        "Monthly": {
          DisplayName: "Past Month"
        },
      }
    },
    Direction: {
      DisplayName: "Direction",
      Values: {
        "Descending": {
          DisplayName: "Descending",
          Default: true
        },
        "Ascending": {
          DisplayName: "Ascending"
        },
      }
    },
    SortBy: {
      DisplayName: "Sort By",
      Values: {
        "Views": {
          DisplayName: "Views",
          Default: true
        },
        "UploadDate": {
          DisplayName: "Upload Date"
        },
        "AdditionDate": {
          DisplayName: "Addition Date"
        }
        
      }
    },
    SongType: {
      DisplayName: "Song Type",
      Values: {
        "All": {
          DisplayName: "All",
          Default: true
        },
        "Vocaloid": {
          DisplayName: "Vocaloid"
        },
        "CeVIO": {
          DisplayName: "CeVIO"
        },
        "SynthesizerV": {
          DisplayName: "SynthesizerV"
        },
        "OtherVoiceSynthesizer": {
          DisplayName: "Other"
        }
      }
    },
}
const rankingsDateStringOptions = {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }

// functions
const queryViewsDatabaseAsync = (queryData, options = {}) => {
    return new Promise( async (resolve, reject) => {
      
      // hash query data & check for cache
      const queryHash = (await getHasherAsync())(JSON.stringify({queryData, ...options}))
      {
  
        // check for cache
        const cachedData = rankingsCache.get(queryHash)
        
        if (cachedData) {
          
          resolve(cachedData.getData())
          return;
          
        }
        
      }

      const preferredLanguage = queryData.Language || rankingsFilterQueryTemplate.Language.default

      const setPreferredLanguageName = (names) => {
        names.preferred = getPreferredLanguageName(names, preferredLanguage)
      }

      const getArtistsFromIds = async (ids) => {
        const artists = await database.artists.getArtistsFromIds(ids)
        artists.forEach(artist => {
          setPreferredLanguageName(artist.names)
        })
        return artists
      }

      const jsonParse = JSON.parse

      const artistConvertLimit = options.artistConvertLimit

      onFinish = async (returnData) => {
        for (const [n, viewData] of returnData.Data.entries()) {
          // convert names
          const names = jsonParse(viewData.names)
          setPreferredLanguageName(names)
          viewData.names = names

          // convert artists
          if (artistConvertLimit && (artistConvertLimit > n) || !artistConvertLimit) {
            const producers = viewData.producers
            if (producers) {
              viewData.producers = await getArtistsFromIds(jsonParse(producers))
            }
            const singers = viewData.singers
            if (singers) {
              viewData.singers = await getArtistsFromIds(jsonParse(singers))
            }
        }
          
        }

        // cache return data
        rankingsCache.set(queryHash, returnData)
      
        resolve(returnData)
      }

      if (options.withChange) {
        databaseProxy.filterRankingsWithChange(queryData, options).then( returnData => onFinish(returnData) ).catch(error => reject(error))
      } else {
        databaseProxy.filterRankings(queryData, options).then( returnData => onFinish(returnData) ).catch( error => reject(error) )
      }

      
    })
}

const getYearReviewTopSongsByType = (defaultFilterParams, options) => {
  return new Promise(async (resolve, reject) => {
    try {
      const lists = []

      for (const [viewType, typeData] of Object.entries(viewTypes)) {
        if (viewType != "") {
          lists.push({
            name: viewType,
            data: await queryViewsDatabaseAsync({
              ViewType: viewType,
              MaxEntries: 10,
              ...defaultFilterParams
            }, {
              ...options,
              limitResult: true
            }).then(data => data.Data)
        })
        }
      }

      resolve(lists)
    } catch (error) {
      reject(error)
    }
  })
}

const getTopArtists = (rankingsData, UID) => {
  return new Promise(async (resolve, reject) => {
    try {
      const cacheKey = "topArtists" + UID
      {
        // check for cache
        const cachedData = highlightsCache.get(cacheKey)

        if (cachedData) {
          resolve(cachedData.getData())
          return;
        }
      }

      // if not cached, get the top singers
      const topSingers = []
      const topProducers = []
      const references = {}

      const addArtistViews = (artist, views, addToArray) => {
        const artistId = artist.artistId
        var reference = references[artistId]
          if (!reference) {
            // create new reference
            reference = {
              data: artist,
              views: 0,
              songCount: 0
            }
            addToArray.push(reference)
            references[artistId] = reference
          }
          reference.views += views
          reference.songCount += 1
      }

      for (const [n, songData] of rankingsData.entries()) {
        const singers = songData.singers
        const producers = songData.producers
        const totalViews = songData.total

        singers.forEach(singer => addArtistViews(singer, totalViews, topSingers))
        producers.forEach(producer => addArtistViews(producer, totalViews, topProducers))
      }

      // sort topSingers
      topSingers.sort((a, b) => {
        return b.views - a.views
      })

      // sort top producers
      topProducers.sort((a, b) => {
        return b.views - a.views
      })

      const returnData = {
        singers: topSingers,
        producers: topProducers
      }

      // set cache
      highlightsCache.set(cacheKey, returnData)
      resolve(returnData)
    } catch (error) {
      reject(error)
    }
  })
}

// route functions
const getFilterPage = async (request, reply) => {
    const parsedCookies = request.parsedCookies || {}
    
    const query = {
      ...request.query,
      ...parsedCookies.filter || {}
    } 

    const filterDefaults = {}
    
    for ( let [filterName, paramData] of Object.entries(rankingsFilterQueryTemplate) ) {

      const filterValue = query[filterName]
      
      if (filterValue) {
        
        filterDefaults[filterValue] = true
        
      } else {
        
        filterDefaults[paramData.default] = true 
      }
    }
    
    // get date bounds
    const viewsMetadata = await database.views.getMetadata() || [] ;
  
    const maximumDate = viewsMetadata[viewsMetadata.length - 1].timestamp

    const viewParams = { 
      seo: request.seo, 
      cookies: parsedCookies, 
      filterOptions: filterPageOptions, 
      filterDefaults: filterDefaults, 
      pageTitle: "Filter Rankings",
      minimumDate: viewsMetadata[0].timestamp,
      defaultDate: query["Date"] || maximumDate,
      maximumDate: maximumDate
    };
    
    return reply.view("pages/filterRankings.hbs", viewParams)
}

const getRemoveAllFilters = async (_, reply) => {
    reply.setObjectCookie("filter", {})
    reply.redirect("/rankings")
}

const getRemoveFilter = async(request, reply) => {
    const parsedCookies = request.parsedCookies
  
    const query = request.query
    
    const filterCookie = parsedCookies.filter || {}
    
    for ( let [filterName, _] of Object.entries(filterCookie) ) {
      
      const removable = query[filterName]
      
      if (removable) {
        
        delete filterCookie[filterName]
        
      }
      
    }
    
    reply.setObjectCookie("filter", filterCookie)
    
    reply.redirect("/rankings")
}

const getAddFilter = async (request, reply) => {
    const parsedCookies = request.parsedCookies
  
    const query = request.query
    const referer = query["referer"] || "/rankings"
    
    const filterCookie = parsedCookies.filter || {}
    
    var newQuery = ""

    const analyticsFilterNames = []
    const analyticsFilterValues = []
    
    for ( let [filterName, paramData] of Object.entries(rankingsFilterQueryTemplate) ) {

      const addable = query[filterName]
      
      if (addable) {
        
        newQuery = newQuery + `${filterName}=${addable}&`
        
        filterCookie[filterName] = addable
        if (addable != paramData.default) {
          analyticsFilterNames.push(filterName)
          analyticsFilterValues.push(addable)
        }
      }
      
    }

    // set analytics
    {
      const params = request.routeConfig["analyticsParams"]

      params['name'] = analyticsFilterNames
      params['value'] = analyticsFilterValues
    }
    
    reply.setObjectCookie("filter", filterCookie)
    
    reply.redirect(`${referer}?${encodeURI(newQuery)}`)
}

const getCurrentYearReview = async(request, reply) => {
  const year = new Date().getFullYear()
  reply.redirect(`${exports.prefix}/year-review/${year}`)
}

const getYearReview = async (request, reply) => {
  const parsedCookies = request.parsedCookies || {}
  const params = { 
    seo: request.seo, 
    cookies: parsedCookies,
  }

  // parse locale
  const locale = (request.headers["accept-language"] || "").split(",")[0]
  
  // get date
  const year = request.params.year
  params.year = year
  
  // construct filter params
  var filterParams = {
    Locale: locale,
    Language: parsedCookies.displayLanguage,
    PublishYear: year
  }

  const queryOptions = {
    limitResult: false, 
    extraArguments: ["producers", "singers"],
    //artistConvertLimit: 10, // only convert the first 10 songs' artists
  }

  // query database
  const databaseQueryResult = await queryViewsDatabaseAsync(filterParams, queryOptions)
  const databaseQueryData = databaseQueryResult.Data

  // load view lists
  {
    const songTypesData = await getYearReviewTopSongsByType(filterParams, queryOptions)
    const lists = [
      {
        name: "Combined",
        data: databaseQueryData.slice(0,10)
      },
      ...songTypesData
    ]
  
    params.lists = lists
  }

  // get top singers
  {
    const topArtists = await getTopArtists(databaseQueryData, filterParams.Language + year)
    const singers = topArtists.singers
    const producers = topArtists.producers
    params.topArtists = [
      {
        type: "Singer",
        title: "Top 10 Singers",
        topFour: singers.slice(0,4),
        data: singers.slice(4,10)
      },
      {
        type: "Producer",
        title: "Top 10 Producers",
        topFour: producers.slice(0,4),
        data: producers.slice(4,10)
      },
      
    ]
  }

  // see if the database is updating
  {
    params.databaseUpdating = databaseProxy.getUpdating()
  }
  
  // add view data to params
    const paramsViewTypesData = {}
    {
      const viewTypeQuery = filterParams["ViewType"] || ""
      for (let [viewType, viewData] of Object.entries(viewTypes)) {
        paramsViewTypesData[viewType] = {
          
          displayName: viewData.displayName,
          isActive: viewType == viewTypeQuery
          
        }
      }

    }
    params.viewTypes = paramsViewTypesData

  return reply.view("pages/yearReview.hbs", params);

}

const getYearReviewFull = async (request, reply) => {
  const parsedCookies = request.parsedCookies || {}

  const params = { seo: request.seo, cookies: parsedCookies }

  // parse locale
  const locale = (request.headers["accept-language"] || "").split(",")[0]
  
  // get date
  const year = request.params.year
  params.year = year
  
  // construct filter params
  var filterParams = {
    Locale: locale,
    Language: parsedCookies.displayLanguage,
    PublishYear: year,
    StartAt: request.query.StartAt || 0
  }
  params.filterParams = filterParams

  // query database
  const databaseQueryResult = await queryViewsDatabaseAsync(filterParams, {withChange: true})
  params.list = databaseQueryResult.Data // add result to params

  const parsedFilterParams = databaseQueryResult.QueryData

  // calculate pages
  {

    const listLength = databaseQueryResult.Length
    const currentPosition = parsedFilterParams.StartAt
    const pageLength = parsedFilterParams.MaxEntries
    
    const totalPages = Math.floor(listLength/pageLength)
    const currentPage = Math.ceil(currentPosition/pageLength)
    
    const surroundingPages = []
    const addFilterURL = "/rankings/filter/add?StartAt="
    const suffix = `&referer=/rankings/year-review/${year}/full`
    
    for (let i = Math.max(0, currentPage - 1); i <= Math.min(totalPages, currentPage + 1); i++) {
      surroundingPages[i] = `${addFilterURL}${i*pageLength}${suffix}`
    }
    
    params.surroundingPages = surroundingPages
    params.currentPageNumber = currentPage
    
    // jump to last page and first page buttons
    if (currentPage - 1 > 0) {
      params.firstPage = `${addFilterURL}0${suffix}`
    }
    
    if (totalPages > currentPage + 1) {
      params.lastPage = `${addFilterURL}${totalPages*pageLength}${suffix}`
      params.lastPageNumber = totalPages + 1
    }
    
    // next/previous page buttons
    if (currentPage > 0) {
      params.previousPage = `${addFilterURL}${(currentPage-1)*pageLength}${suffix}`
    }
    if (totalPages > currentPage) {
      params.nextPage = `${addFilterURL}${(currentPage+1)*pageLength}${suffix}`
    }
    
  }
  
  // see if the database is updating
  {
    params.databaseUpdating = databaseProxy.getUpdating()
  }

  // add view data to params
    const paramsViewTypesData = {}
    {
      const viewTypeQuery = filterParams["ViewType"] || ""
      for (let [viewType, viewData] of Object.entries(viewTypes)) {
        paramsViewTypesData[viewType] = {
          
          displayName: viewData.displayName,
          isActive: viewType == viewTypeQuery
          
        }
      }

    }
    params.viewTypes = paramsViewTypesData

  return reply.view("pages/yearReviewFull.hbs", params);
}

const getRankings = async (request, reply) => {
    // params is an object we'll pass to our handlebars template
  
    const parsedCookies = request.parsedCookies || {} 
    
    let params = { seo: request.seo, cookies: parsedCookies };
    
    // parse locale
    const locale = (request.headers["accept-language"] || "").split(",")[0]
  
    // validate query
    const requestQuery = {
      ...request.query,
      ...parsedCookies.filter || {}
    }
    
    // construct filter params
    let isFiltered = false
    var filterParams = {
      
      Locale: locale,
      Language: parsedCookies.displayLanguage,
      ...requestQuery
      
    }
    
    var uniqueFilterParams = {} // filter params taht aren't default
    
    for ( let [filterName, paramData] of Object.entries(rankingsFilterQueryTemplate) ) {
      const filterValue = requestQuery[filterName]

      if (filterValue && filterValue != paramData.default) {
          isFiltered = true
          
          uniqueFilterParams[filterName] = filterValue
      }
      
    }
  
    params.isFiltered = isFiltered
    params.filterParams = filterParams
    params.uniqueFilterParams = uniqueFilterParams
  
    // query database
    const databaseQueryResult = await queryViewsDatabaseAsync(filterParams, {withChange: true})
    params.list = databaseQueryResult.Data // add result to params

    const parsedFilterParams = databaseQueryResult.QueryData

    // calculate pages
    {

      const listLength = databaseQueryResult.Length
      const currentPosition = parsedFilterParams.StartAt
      const pageLength = parsedFilterParams.MaxEntries
      
      const totalPages = Math.floor(listLength/pageLength)
      const currentPage = Math.ceil(currentPosition/pageLength)
      
      const surroundingPages = []
      const addFilterURL = "/rankings/filter/add?StartAt="
        
      for (let i = Math.max(0, currentPage - 1); i <= Math.min(totalPages, currentPage + 1); i++) {
        surroundingPages[i] = `${addFilterURL}${i*pageLength}`
      }
      
      params.surroundingPages = surroundingPages
      params.currentPageNumber = currentPage
      
      // jump to last page and first page buttons
      if (currentPage - 1 > 0) {
        params.firstPage = `${addFilterURL}0`
      }
      
      if (totalPages > currentPage + 1) {
        params.lastPage = `${addFilterURL}${totalPages*pageLength}`
        params.lastPageNumber = totalPages + 1
      }
      
      // next/previous page buttons
      if (currentPage > 0) {
        params.previousPage = `${addFilterURL}${(currentPage-1)*pageLength}`
      }
      if (totalPages > currentPage) {
        params.nextPage = `${addFilterURL}${(currentPage+1)*pageLength}`
      }
      
    }
    
    // see if the database is updating
    {
      params.databaseUpdating = databaseProxy.getUpdating()
    }
    
    //parse timestamp
    {
      
      const date = new Date(databaseQueryResult.Timestamp)
  
      if (date) {
        
        params.date = date.toLocaleDateString(locale, rankingsDateStringOptions)
        
      }
      
    }
  
    // add view data to params
      const paramsViewTypesData = {}
      {
        const viewTypeQuery = parsedFilterParams["ViewType"] || ""
        for (let [viewType, viewData] of Object.entries(viewTypes)) {
          paramsViewTypesData[viewType] = {
            
            displayName: viewData.displayName,
            isActive: viewType == viewTypeQuery
            
          }
        }
  
      }
      params.viewTypes = paramsViewTypesData
      
    // The Handlebars code will be able to access the parameter values and build them into the page
    return reply.view("pages/rankings.hbs", params);
  }

exports.prefix = "/rankings"

exports.register = (fastify, options, done) => {
    fastify.get("/", {
      config: {
        analyticsEvent: "page_visit",
        analyticsParams: {'page_name': "rankings"}
      },
    }, getRankings)

    fastify.get("/filter", {
      config: {
        analyticsEvent: "page_visit",
        analyticsParams: {'page_name': "filter"}
      },
    }, getFilterPage)
    fastify.get("/filter/add", {
      config: {
        analyticsEvent: "filter_add",
        analyticsParams: {'filter_name': [], 'filter_value': []}
      },
    }, getAddFilter)
    fastify.get("/filter/remove", getRemoveFilter)
    fastify.get("/filter/remove-all", getRemoveAllFilters)

    // year review endpoints
    fastify.get("/year-review/:year", {
      config: {
        analyticsEvent: "page_visit",
        analyticsParams: {'page_name': "rankings/year-review"}
      }
    }, getYearReview)
    fastify.get("/year-review/:year/full", {
      config: {
        analyticsEvent: "page_visit",
        analyticsParams: {'page_name': "rankings/year-review/full"}
      }
    }, getYearReviewFull)
    fastify.get("/year-review", getCurrentYearReview)
    done();
}