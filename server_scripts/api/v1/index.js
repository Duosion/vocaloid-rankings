// strings
const modulePath = "../../"

const workingDirectory = process.cwd()

const databaseViewsFilePath = workingDirectory + "/database/views/"
const databaseSongsDataFilePath = workingDirectory + "/database/songsData.txt"
const databaseViewsMetadataFilePath = workingDirectory + "/database/viewsMetadata.txt"

// libraries
  // cacher
    const cacher = require(modulePath + "cacher").cacher
    // create caches
      const apiSongsCache = new cacher()
    
  // database proxy
    const databaseProxy = require(modulePath + "database")

// tables
  const historicalDataQueryTemplate = databaseProxy.historicalDataQueryTemplate
    
// functions
const buildApiError = (message) => {
  
  return {
    
    Success: false,
    
    Body: {
      
      Message: message
      
    },

  }
  
}

const buildApiResponse = (body) => {
  
  return {
    
    Success: true,
    
    Body: body || {},
    
  }
  
}

const apiError = (reply, statusCode, message) => {
  
  reply.status(statusCode || 400)
  reply.send(buildApiError(message))
  
}

const apiResponse = (reply, body) => {
  
  reply.status(200)
  reply.send(buildApiResponse(body))
  
}

// api endpoints
const song = async (request, reply) => {
  
  const songName = request.params.songName
  if (!songName) { apiError(reply, 404, "Invalid song name provided."); return; }

    // check for cache
    const cachedData = apiSongsCache.get(songName)
    if (cachedData) {
      reply.send(cachedData.getData())
      return;
        
    }
  
  await databaseProxy.getSongData(songName)
    .then(songData => {
    
    // cache return data
    apiSongsCache.set(songName, songData)
  
    // return data
    apiResponse(reply, songData)
    
  }).catch(error => apiError(reply, 500, error))
  
}

const rankings = async (request, reply) => {
  
  // validate query
  const requestQuery = request.query
  
  await databaseProxy.filterRankingsWithChange(requestQuery)
    .then(rankingsData => {

      const body = buildApiResponse(rankingsData.Data)
      
      body["Timestamp"] = rankingsData.Timestamp
      
    
      reply.status(200)
      reply.send(body)
    
  }).catch(error => apiError(reply, 500, error))
  
}

const historical = async (request, reply) => {
  
  // validate query
  const requestQuery = request.query
  
  await databaseProxy.getHistoricalData(requestQuery)
    .then(historicalData => {

      apiResponse(reply, historicalData)
    
  }).catch(error => apiError(reply, 500, error))
  
}

const isDatabaseUpdating = async (request, reply) => {

  var updating = databaseProxy.getUpdating()
  const isUpdating = updating ? true : false

  updating = updating || {}

  updating["updating"] = isUpdating

  apiResponse(reply, updating)

}

const routes = [
  {
    route: "/song/:songName",
    handler: song,
    authenticate: true
  },
  {
    route: "/rankings",
    handler: rankings,
    authenticate: true
  },
  {
    route: "/historical",
    handler: historical,
    authenticate: true
  },
  {
    route: "/updating",
    handler: isDatabaseUpdating,
    authenticate: false
  }
]


exports.prefix = "/v1"

exports.register =  (fastify, opts, done) => {
  
  // api key validation
  fastify.addHook("preValidation", (req, reply, done) => {
    const config = req.routeConfig

    if (config['authenticate']) { // authenticate only if required

      const headers = req.headers
      const query = req.query

      // get api token
      const apiToken = headers.authorization || query.authorization
      if (!apiToken) { apiError(reply, 403, "No API token was provided."); return; }
      
      // verify api token
      if (apiToken != process.env.APIToken) { apiError(reply, 403, "Invalid API token was provided."); return; }

    }
    
    done()
  })

  // register routes
  for (let [_, routeData] of routes.entries()) {
    fastify.get(routeData.route, {
      config: { authenticate: routeData.authenticate }
    }, routeData.handler)
  }
  
  done()
  
}