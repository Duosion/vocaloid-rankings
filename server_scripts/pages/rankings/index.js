const workingDirectory = process.cwd()
const modulePath = workingDirectory + "/server_scripts/"

// import
const database = require(workingDirectory + "/db")
const databaseProxy = require(modulePath + "/database")

const { generateTimestamp, viewTypes, getHasherAsync, caches } = require(modulePath + "shared") // shared functions

// implement caches
const rankingsCache = caches.rankingsCache // initialize rankings cache with a 120 second lifespan

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

const rankingsFilterQueryTemplate = databaseProxy.rankingsFilterQueryTemplate
const rankingsDateStringOptions = {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }

// functions
const queryViewsDatabaseAsync = (queryData) => {
    return new Promise( async (resolve, reject) => {
      
      // hash query data & check for cache
      const queryHash = (await getHasherAsync())(JSON.stringify(queryData))
      {
  
        // check for cache
        const cachedData = rankingsCache.get(queryHash)
        
        if (cachedData) {
          
          resolve(cachedData.getData())
          return;
          
        }
        
      }
      
      databaseProxy.filterRankingsWithChange(queryData).then( returnData => {
        
        // cache return data
        rankingsCache.set(queryHash, returnData)
      
        resolve(returnData)
        
      }).catch(error => reject(error))
      
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
    
    for ( let [filterName, defaultValue] of Object.entries(rankingsFilterQueryTemplate) ) {
      
      const filterValue = query[filterName]
      
      if (filterValue) {
        
        filterDefaults[filterValue] = true
        
      } else {
        
        filterDefaults[defaultValue] = true
        
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
    
    const filterCookie = parsedCookies.filter || {}
    
    var newQuery = ""

    const analyticsFilterNames = []
    const analyticsFilterValues = []
    
    for ( let [filterName, filterDefault] of Object.entries(rankingsFilterQueryTemplate) ) {
      
      const addable = query[filterName]
      
      if (addable) {
        
        newQuery = newQuery + `${filterName}=${addable}&`
        
        filterCookie[filterName] = addable
        if (addable != filterDefault) {
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
    
    reply.redirect("/rankings?" + encodeURI(newQuery))
}

const getYearReview = async (request, reply) => {

  const parsedCookies = request.parsedCookies || {}

  const params = { seo: request.seo, cookies: parsedCookies }

  // parse locale
  const locale = (request.headers["accept-language"] || "").split(",")[0]
  
  // get date
  const year = 2022
  params.year = year
  
  // construct filter params
  var filterParams = {
    
    Locale: locale,
    Language: parsedCookies.displayLanguage,
    PublishYear: year
    
  }

  // query database
  const databaseQueryResult = await queryViewsDatabaseAsync(filterParams)
  params.list = databaseQueryResult.Data // add result to params

  // calculate pages
  {
    
    const listLength = databaseQueryResult.Length
    const currentPosition = filterParams.StartAt
    const pageLength = filterParams.MaxEntries
    
    const totalPages = Math.floor(listLength/pageLength)
    const currentPage = Math.ceil(currentPosition/pageLength)

    const surroundingPages = []
      
    for (let i = Math.max(0, currentPage - 1); i <= Math.min(totalPages, currentPage + 1); i++) {
      surroundingPages[i] = `/rankings?StartAt=${i*pageLength}`
    }
    
    params.surroundingPages = surroundingPages
    params.currentPageNumber = currentPage
    
    // jump to last page and first page buttons
    if (currentPage - 1 > 0) {
      params.firstPage = `/rankings`
    }
    
    if (totalPages > currentPage + 1) {
      params.lastPage = `/rankings?StartAt=${totalPages*pageLength}`
      params.lastPageNumber = totalPages + 1
    }
    
    // next/previous page buttons
    if (currentPage > 0) {
      params.previousPage = `/rankings?StartAt=${(currentPage-1)*pageLength}`
    }
    if (totalPages > currentPage) {
      params.nextPage = `/rankings?StartAt=${(currentPage+1)*pageLength}`
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

  return reply.view("pages/yearReview.hbs", params);

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
      
    }
    
    var uniqueFilterParams = {} // filter params taht aren't default
    
    for ( let [filterName, defaultValue] of Object.entries(rankingsFilterQueryTemplate) ) {
      
      const filterValue = requestQuery[filterName]
      
      // make the default value for the date filter the current date
      if (filterName == "Date") {
        defaultValue = generateTimestamp().Name
      }
      
      if (!filterValue) {
        filterParams[filterName] = filterParams[filterName] || defaultValue
      } else {
        
        if (filterValue != defaultValue) {
          isFiltered = true
          
          uniqueFilterParams[filterName] = filterValue
          
        }
        
        filterParams[filterName] = filterValue
      }
      
    }
  
    params.isFiltered = isFiltered
    params.filterParams = filterParams
    params.uniqueFilterParams = uniqueFilterParams
  
    // query database
    const databaseQueryResult = await queryViewsDatabaseAsync(filterParams)
    params.list = databaseQueryResult.Data // add result to params
  
    // calculate pages
    {
      
      const listLength = databaseQueryResult.Length
      const currentPosition = filterParams.StartAt
      const pageLength = filterParams.MaxEntries
      
      const totalPages = Math.floor(listLength/pageLength)
      const currentPage = Math.ceil(currentPosition/pageLength)
  
          
      const surroundingPages = []
        
      for (let i = Math.max(0, currentPage - 1); i <= Math.min(totalPages, currentPage + 1); i++) {
        surroundingPages[i] = `/rankings?StartAt=${i*pageLength}`
      }
      
      params.surroundingPages = surroundingPages
      params.currentPageNumber = currentPage
      
      // jump to last page and first page buttons
      if (currentPage - 1 > 0) {
        params.firstPage = `/rankings`
      }
      
      if (totalPages > currentPage + 1) {
        params.lastPage = `/rankings?StartAt=${totalPages*pageLength}`
        params.lastPageNumber = totalPages + 1
      }
      
      // next/previous page buttons
      if (currentPage > 0) {
        params.previousPage = `/rankings?StartAt=${(currentPage-1)*pageLength}`
      }
      if (totalPages > currentPage) {
        params.nextPage = `/rankings?StartAt=${(currentPage+1)*pageLength}`
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
        const viewTypeQuery = filterParams["ViewType"] || ""
        for (let [viewType, viewData] of Object.entries(viewTypes)) {
          paramsViewTypesData[viewType] = {
            
            displayName: viewData.displayName,
            isActive: viewType == viewTypeQuery
            
          }
        }
  
      }
      params.viewTypes = paramsViewTypesData
      
    // The Handlebars code will be able to access the parameter values and build them into the page
    return reply.view("pages/rankings_new.hbs", params);
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

    fastify.get("/year-review", {
      config: {
        analyticsEvent: "page_visit",
        analyticsParams: {'page_name': "rankings/year-review"}
      }
    }, getYearReview)

    done();
}