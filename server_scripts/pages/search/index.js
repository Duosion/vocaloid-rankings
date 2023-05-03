const SearchQueryParams = require("../../../db/dataClasses/SearchQueryParams")
const SearchQueryResult = require("../../../db/dataClasses/SearchQueryResult")
const NameType = require("../../../db/enums/NameType")
const SearchQueryResultItemType = require("../../../db/enums/SearchQueryResultItemType")

const workingDirectory = process.cwd()
const modulePath = workingDirectory + "/server_scripts"

const database = require(workingDirectory + "/db")
const { caches, getHasherAsync } = require(modulePath + "/shared")
const { getPreferredLanguageName } = require(modulePath + "/locale")

// import search cache
const searchCache = caches.searchCache

/**
 * 
 * @param {SearchQueryParams} queryParams 
 * @param {Object} options 
 * @returns {Promse<SearchQueryResult|Error>} A promise that resolves with a SearchQueryResult or an error.
 */
const querySearchAsync = (queryParams, options) => {
  return new Promise(async (resolve, reject) => {
    try {

      const queryHash = (await getHasherAsync())(JSON.stringify({ ...queryParams, ...options }))
      {
        // check for cache
        const cachedData = searchCache.get(queryHash)
        if (cachedData) {
          resolve(cachedData.getData())
          return;
        }
      }

      database.songsDataProxy.searchQuery(queryParams).then(result => {

        const preferredLanguage = options.preferredLanguage || NameType.Original

        const getPreferredName = (names) => {
          return getPreferredLanguageName(names, preferredLanguage)
        }

        result.results.forEach(result => {
          const data = result.data
          switch (result.type) {
            case SearchQueryResultItemType.Song:
              result.preferredName = getPreferredName(data.names)
              result.isSong = true

              // handle placement
              {
                const placements = []

                // all time
                placements.push({
                  placement: data.placement.allTime,
                  text: "search_placement_all_time"
                })

                result.placements = placements
              }

              break
            case SearchQueryResultItemType.Artist:
              result.preferredName = getPreferredName(data.names)
              result.isArtist = true
              break
          }
        })

        // cache return data
        searchCache.set(queryHash, result)

        resolve(result)
      }).catch(error => { reject(error) })
    } catch (error) {
      reject(error)
    }
  })
}

// route functions
const getSearchRoute = async (request, reply) => {
  const params = request.query
  const parsedCookies = request.parsedCookies || {}

  // process search query
  const searchQuery = params.query || ''
  request.addHbParam('searchQuery', searchQuery)

  //add page title
  request.addHbParam('pageTitle', `${(request.localization || {})['search_hint']} - ${searchQuery}`)

  const queryParams = new SearchQueryParams(
    searchQuery,
    25,
    Number.parseInt(params.startAt) || 0
  )

  const queryResult = await querySearchAsync(queryParams, {
    preferredLanguage: NameType.fromId(parsedCookies.titleLanguage)
  }).catch(error => {
    reply.send({ code: 400, message: error.message })
    return;
  })

  request.addHbParam('queryResult', queryResult)

  if (queryResult.results.length == 0) {
    request.addHbParam('emptyResultsSet', true)
  }

  // calculate pages
  {
    const hbParams = request.hbParams

    const listLength = queryResult.totalCount
    const currentPosition = queryParams.startAt
    const pageLength = queryParams.maxEntries

    const totalPages = Math.floor(listLength / pageLength)
    const currentPage = Math.ceil(currentPosition / pageLength)

    const surroundingPages = []
    const searchPageURL = `/search?query=${searchQuery}&startAt=`

    for (let i = Math.max(0, currentPage - 1); i <= Math.min(totalPages, currentPage + 1); i++) {
      surroundingPages[i] = `${searchPageURL}${i * pageLength}`
    }

    hbParams.surroundingPages = surroundingPages
    hbParams.currentPageNumber = currentPage

    // jump to last page and first page buttons
    if (currentPage - 1 > 0) {

      hbParams.firstPage = `${searchPageURL}0`
    }

    if (totalPages > currentPage + 1) {
      hbParams.lastPage = `${searchPageURL}${totalPages * pageLength}`
      hbParams.lastPageNumber = totalPages + 1
    }

    // next/previous page buttons
    if (currentPage > 0) {
      hbParams.previousPage = `${searchPageURL}${(currentPage - 1) * pageLength}`
    }
    if (totalPages > currentPage) {
      hbParams.nextPage = `${searchPageURL}${(currentPage + 1) * pageLength}`
    }
  }

  return reply.view('pages/search.hbs', request.hbParams)
}

// exports
exports.prefix = "/search"

exports.register = (fastify, options, done) => {
  fastify.get("/", getSearchRoute)

  done()
}