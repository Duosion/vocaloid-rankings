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

      database.songsData.searchQuery(queryParams).then(result => {

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
  const parsedCookies = request.cookies
  // process search query
  const searchQuery = params.query || ''
  request.addHbParam('searchQuery', searchQuery)

  const queryResult = await querySearchAsync(new SearchQueryParams(searchQuery), {
    preferredLanguage: NameType.fromId(parsedCookies.titleLanguage)
  }).catch(error => {
    reply.send({ code: 400, message: error.message })
    return;
  })

  request.addHbParam('queryResult', queryResult)

  if (queryResult.results.length == 0) {
    request.addHbParam('emptyResultsSet', true)
  }

  return reply.view('pages/search.hbs', request.hbParams)
}

// exports
exports.prefix = "/search"

exports.register = (fastify, options, done) => {
  fastify.get("/", getSearchRoute)

  done()
}